(function () {
  "use strict";

  var results = [];
  var resultList = document.getElementById("results");
  var summary = document.getElementById("summary");

  function future(days, hour) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour || 10, 0, 0, 0);
    return date.toISOString();
  }

  function activityPayload(title) {
    return {
      title: title || "测试活动",
      category: "讲座",
      description: "用于验证活动创建、发布、报名及容量控制的活动说明。",
      location: "测试教室",
      capacity: 10,
      startAt: future(5, 10),
      endAt: future(5, 12),
      registrationDeadline: future(3, 18),
      status: "draft"
    };
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message || "断言失败");
  }

  function assertError(fn, expectedText) {
    var threw = false;
    try {
      fn();
    } catch (error) {
      threw = true;
      if (expectedText) assert(error.message.indexOf(expectedText) !== -1, "错误信息不符合预期：" + error.message);
    }
    assert(threw, "操作本应被拒绝，但实际执行成功。");
  }

  function run(name, fn) {
    try {
      window.CampusStore.reset();
      fn();
      results.push({ name: name, pass: true, message: "通过" });
    } catch (error) {
      results.push({ name: name, pass: false, message: error.message });
    }
  }

  run("学生账号可以登录并恢复会话", function () {
    var user = window.CampusAuth.login("student", "student123");
    assert(user.role === "student", "登录角色不正确");
    assert(window.CampusAuth.currentUser().id === user.id, "会话未正确保持");
  });

  run("学生可以报名未参加的活动", function () {
    window.CampusAuth.login("student", "student123");
    var registration = window.CampusActivities.register("activity-open-day");
    assert(registration.status === "registered", "报名状态不正确");
    assert(window.CampusActivities.activeCount("activity-open-day") === 1, "有效报名数量不正确");
  });

  run("重复报名会被拒绝", function () {
    window.CampusAuth.login("student", "student123");
    window.CampusActivities.register("activity-open-day");
    assertError(function () { window.CampusActivities.register("activity-open-day"); }, "已经报名");
  });

  run("容量已满时第二位学生不能报名", function () {
    var activity = window.CampusActivities.getActivity("activity-open-day");
    activity.capacity = 1;
    window.CampusStore.save();
    window.CampusAuth.login("student", "student123");
    window.CampusActivities.register(activity.id);
    window.CampusAuth.logout();
    window.CampusAuth.register({ displayName: "测试学生二", username: "student_two", password: "123456", confirmPassword: "123456" });
    assertError(function () { window.CampusActivities.register(activity.id); }, "名额已满");
  });

  run("取消报名会释放名额", function () {
    var activity = window.CampusActivities.getActivity("activity-open-day");
    activity.capacity = 1;
    window.CampusStore.save();
    window.CampusAuth.login("student", "student123");
    window.CampusActivities.register(activity.id);
    window.CampusActivities.cancelRegistration(activity.id);
    window.CampusAuth.logout();
    window.CampusAuth.register({ displayName: "测试学生二", username: "student_two", password: "123456", confirmPassword: "123456" });
    window.CampusActivities.register(activity.id);
    assert(window.CampusActivities.activeCount(activity.id) === 1, "取消后名额没有正常释放");
  });

  run("学生不能创建教师活动", function () {
    window.CampusAuth.login("student", "student123");
    assertError(function () { window.CampusActivities.createActivity(activityPayload("越权活动")); }, "权限");
  });

  run("教师可以创建并发布活动", function () {
    window.CampusAuth.login("teacher", "teacher123");
    var created = window.CampusActivities.createActivity(activityPayload("新增测试活动"));
    assert(created.status === "draft", "新活动应默认保存为草稿");
    var published = window.CampusActivities.setActivityStatus(created.id, "published");
    assert(published.status === "published", "活动发布状态不正确");
    assert(window.CampusActivities.listVisibleActivities().some(function (item) { return item.id === created.id; }), "发布后活动未进入活动中心");
  });

  run("教师可以查看报名名单并导出 CSV", function () {
    window.CampusAuth.login("student", "student123");
    window.CampusActivities.register("activity-open-day");
    window.CampusAuth.logout();
    window.CampusAuth.login("teacher", "teacher123");
    var rows = window.CampusActivities.getRoster("activity-open-day");
    var csv = window.CampusActivities.exportRosterCsv("activity-open-day");
    assert(rows.length === 1, "教师名单数量不正确");
    assert(csv.indexOf("演示学生") !== -1 && csv.indexOf("用户名") !== -1, "CSV 内容不完整");
  });

  run("管理员可以停用学生账号", function () {
    window.CampusAuth.login("admin", "admin123");
    var student = window.CampusAuth.findUserById("user-student-demo");
    var updated = window.CampusAuth.setUserStatus(student.id, "disabled");
    assert(updated.status === "disabled", "账号未成功停用");
  });

  var passed = results.filter(function (item) { return item.pass; }).length;
  results.forEach(function (item) {
    var li = document.createElement("li");
    li.className = item.pass ? "pass" : "fail";
    li.textContent = (item.pass ? "✓ " : "✗ ") + item.name + "：" + item.message;
    resultList.appendChild(li);
  });
  summary.textContent = "共 " + results.length + " 项测试，通过 " + passed + " 项，失败 " + (results.length - passed) + " 项。";
  document.body.setAttribute("data-test-status", passed === results.length ? "passed" : "failed");
  document.body.setAttribute("data-test-pass", String(passed));
  document.body.setAttribute("data-test-total", String(results.length));
  window.__TEST_RESULTS__ = { passed: passed, total: results.length, results: results };
})();
