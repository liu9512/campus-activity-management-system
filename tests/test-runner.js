(function () {
  "use strict";
  var results = [];
  var resultList = document.getElementById("results");
  var summary = document.getElementById("summary");
  var activitySequence = 0;

  function future(days, hour) {
    var date = new Date(); date.setDate(date.getDate() + days); date.setHours(hour || 10, 0, 0, 0); return date.toISOString();
  }
  function activityPayload(title, overrides) {
    return Object.assign({
      title: title || ("测试活动" + (++activitySequence)), category: "讲座",
      description: "用于验证V2.0审核、候补与回归流程的活动说明。", location: "测试教室",
      capacity: 10, startAt: future(5, 10), endAt: future(5, 12), registrationDeadline: future(3, 18),
      requiresReview: false, eligibilityText: "全校学生均可报名。", status: "draft"
    }, overrides || {});
  }
  function assert(condition, message) { if (!condition) throw new Error(message || "断言失败"); }
  function assertError(fn, expectedText) {
    var threw = false;
    try { fn(); } catch (error) { threw = true; if (expectedText) assert(error.message.indexOf(expectedText) !== -1, "错误信息不符合预期：" + error.message); }
    assert(threw, "操作本应被拒绝，但实际执行成功。");
  }
  function run(name, fn) {
    try { window.CampusStore.reset(); fn(); results.push({ name: name, pass: true, message: "通过" }); }
    catch (error) { results.push({ name: name, pass: false, message: error.message }); }
  }
  function addTeacher(id, username) {
    window.CampusStore.getData().users.push({ id: id, username: username, displayName: "测试教师", password: window.CampusStore.encodePassword("teacher123"), role: "teacher", status: "active", createdAt: new Date().toISOString() });
    window.CampusStore.save();
  }

  run("V1回归：学生账号登录和活动浏览正常", function () {
    var user = window.CampusAuth.login("student", "student123");
    assert(user.role === "student", "登录角色不正确");
    assert(window.CampusActivities.listVisibleActivities().length >= 3, "已发布活动未正确显示");
  });

  run("V1回归：无需审核且有名额时直接录取", function () {
    window.CampusAuth.login("student", "student123");
    var reg = window.CampusActivities.register("activity-open-day");
    assert(reg.status === "registered", "应直接成为正式参加人员");
  });

  run("满员后允许学生进入候补队列", function () {
    var activity = window.CampusActivities.getActivity("activity-open-day"); activity.capacity = 1; window.CampusStore.save();
    window.CampusAuth.login("student", "student123");
    var reg = window.CampusActivities.register(activity.id);
    assert(reg.status === "waitlist", "满员后应进入候补");
    assert(window.CampusActivities.getWaitlistPosition(reg) === 2, "候补顺序应为第2位");
  });

  run("候补按进入时间排序，退出后后续人员前移", function () {
    var activity = window.CampusActivities.getActivity("activity-open-day"); activity.capacity = 1; window.CampusStore.save();
    window.CampusAuth.login("student", "student123");
    var mine = window.CampusActivities.register(activity.id);
    var before = window.CampusActivities.waitlistRegistrations(activity.id).map(function (item) { return item.userId; });
    assert(before[0] === "user-student-three" && before[1] === "user-student-demo", "初始候补顺序不正确");
    window.CampusActivities.cancelRegistration(activity.id);
    var after = window.CampusActivities.waitlistRegistrations(activity.id);
    assert(after.length === 1 && after[0].userId === "user-student-three", "退出候补后顺序没有前移");
    assert(mine.status === "cancelled", "退出候补状态不正确");
  });

  run("正式人员取消后自动递补候补第一名", function () {
    window.CampusAuth.login("student2", "student123");
    var result = window.CampusActivities.cancelRegistration("activity-open-day");
    assert(result.previousStatus === "registered", "取消前状态不正确");
    assert(result.promoted && result.promoted.userId === "user-student-three", "应按顺序递补候补第一名");
    assert(window.CampusActivities.getRegistration("activity-open-day", "user-student-three").status === "registered", "候补人员未转为正式");
  });

  run("需要审核的活动提交后进入待审核", function () {
    var activity = window.CampusActivities.getActivity("activity-lecture"); activity.capacity = 3; window.CampusStore.save();
    window.CampusAuth.login("student3", "student123");
    var reg = window.CampusActivities.register(activity.id);
    assert(reg.status === "pending", "审核活动应进入待审核");
  });

  run("教师审核通过且有名额时转为正式参加", function () {
    var activity = window.CampusActivities.getActivity("activity-lecture"); activity.capacity = 3; window.CampusStore.save();
    window.CampusAuth.login("teacher", "teacher123");
    var pending = window.CampusActivities.pendingRegistrations(activity.id)[0];
    var reg = window.CampusActivities.reviewRegistration(pending.id, "approve", "资格符合", window.CampusAuth.currentUser());
    assert(reg.status === "registered", "审核通过后应转为正式参加");
  });

  run("审核不通过时记录为未通过", function () {
    window.CampusAuth.login("teacher", "teacher123");
    var pending = window.CampusActivities.pendingRegistrations("activity-lecture")[0];
    var reg = window.CampusActivities.reviewRegistration(pending.id, "reject", "不符合资格", window.CampusAuth.currentUser());
    assert(reg.status === "rejected" && reg.decisionNote === "不符合资格", "拒绝审核结果不正确");
  });

  run("审核通过但满员时进入候补", function () {
    window.CampusAuth.login("teacher", "teacher123");
    var pending = window.CampusActivities.pendingRegistrations("activity-lecture")[0];
    var reg = window.CampusActivities.reviewRegistration(pending.id, "approve", "资格符合", window.CampusAuth.currentUser());
    assert(reg.status === "waitlist", "满员审核通过后应进入候补");
    assert(window.CampusActivities.getWaitlistPosition(reg) === 1, "候补位置不正确");
  });

  run("教师只能审核本人负责的活动", function () {
    addTeacher("user-other-teacher", "otherteacher");
    window.CampusAuth.login("otherteacher", "teacher123");
    var pending = window.CampusActivities.pendingRegistrations("activity-lecture")[0];
    assertError(function () { window.CampusActivities.reviewRegistration(pending.id, "approve", "", window.CampusAuth.currentUser()); }, "本人负责");
  });

  run("学生不能执行教师审核", function () {
    window.CampusAuth.login("student", "student123");
    var pending = window.CampusActivities.pendingRegistrations("activity-lecture")[0];
    assertError(function () { window.CampusActivities.reviewRegistration(pending.id, "approve", "", window.CampusAuth.currentUser()); }, "权限");
  });

  run("教师只能管理本人创建的活动", function () {
    addTeacher("user-other-teacher", "otherteacher");
    var activity = window.CampusActivities.getActivity("activity-open-day");
    assert(!window.CampusActivities.canManage(activity, window.CampusAuth.findUserById("user-other-teacher")), "其他教师不应拥有管理权限");
  });

  run("管理员可以下架并恢复违规活动", function () {
    window.CampusAuth.login("admin", "admin123");
    var suspended = window.CampusActivities.suspendActivity("activity-open-day", "信息明显错误", window.CampusAuth.currentUser());
    assert(window.CampusActivities.effectiveStatus(suspended) === "suspended", "管理员下架未生效");
    var restored = window.CampusActivities.restoreActivity(suspended.id, window.CampusAuth.currentUser());
    assert(restored.status === "published", "恢复后的活动状态不正确");
  });

  run("教师名单区分正式、待审核和候补", function () {
    window.CampusAuth.login("teacher", "teacher123");
    var roster = window.CampusActivities.getRoster("activity-open-day");
    assert(roster.some(function (item) { return item.registration.status === "registered"; }), "正式名单缺失");
    assert(roster.some(function (item) { return item.registration.status === "waitlist"; }), "候补名单缺失");
    var csv = window.CampusActivities.exportRosterCsv("activity-open-day");
    assert(csv.indexOf("候补中") !== -1 && csv.indexOf("候补顺序") !== -1, "CSV缺少候补状态信息");
  });

  run("V1回归：活动容量不能低于正式人数", function () {
    window.CampusAuth.login("teacher", "teacher123");
    var activity = window.CampusActivities.getActivity("activity-open-day");
    assertError(function () { window.CampusActivities.updateActivity(activity.id, activityPayload(activity.title, { capacity: 0 }), window.CampusAuth.currentUser()); }, "容量");
  });

  var passed = results.filter(function (item) { return item.pass; }).length;
  results.forEach(function (item) {
    var li = document.createElement("li"); li.className = item.pass ? "pass" : "fail";
    li.textContent = (item.pass ? "✓ " : "✗ ") + item.name + "：" + item.message; resultList.appendChild(li);
  });
  summary.textContent = "共 " + results.length + " 项测试，通过 " + passed + " 项，失败 " + (results.length - passed) + " 项。";
  document.body.setAttribute("data-test-status", passed === results.length ? "passed" : "failed");
  document.body.setAttribute("data-test-pass", String(passed)); document.body.setAttribute("data-test-total", String(results.length));
  window.__TEST_RESULTS__ = { passed: passed, total: results.length, results: results };
})();