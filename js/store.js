(function () {
  "use strict";

  var STORAGE_KEY = "campus-activity-system-v1";
  var SCHEMA_VERSION = 2;
  var memoryStorage = {};

  function makeId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function addDays(days, hour) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour || 10, 0, 0, 0);
    return date.toISOString();
  }

  function minutesAgo(minutes) {
    return new Date(Date.now() - minutes * 60 * 1000).toISOString();
  }

  function encodePassword(value) {
    try { return btoa(unescape(encodeURIComponent(String(value)))); }
    catch (error) { return String(value); }
  }

  function createSeedData() {
    var nowIso = new Date().toISOString();
    var users = [
      { id: "user-admin-demo", username: "admin", displayName: "系统管理员", password: encodePassword("admin123"), role: "admin", status: "active", createdAt: nowIso },
      { id: "user-teacher-demo", username: "teacher", displayName: "李老师", password: encodePassword("teacher123"), role: "teacher", status: "active", createdAt: nowIso },
      { id: "user-student-demo", username: "student", displayName: "演示学生", password: encodePassword("student123"), role: "student", status: "active", createdAt: nowIso },
      { id: "user-student-two", username: "student2", displayName: "王同学", password: encodePassword("student123"), role: "student", status: "active", createdAt: nowIso },
      { id: "user-student-three", username: "student3", displayName: "陈同学", password: encodePassword("student123"), role: "student", status: "active", createdAt: nowIso }
    ];

    return {
      version: SCHEMA_VERSION,
      users: users,
      activities: [
        {
          id: "activity-open-day", title: "校园开放日志愿服务", category: "志愿活动",
          description: "协助来访同学完成校园路线引导、咨询答疑和秩序维护，结束后统一记录志愿服务时长。",
          location: "学校南门服务台", startAt: addDays(5, 9), endAt: addDays(5, 16), registrationDeadline: addDays(2, 18),
          capacity: 2, organizerId: "user-teacher-demo", status: "published", requiresReview: false,
          eligibilityText: "面向全校学生；有志愿服务经历者优先。", suspendedAt: null, previousStatus: null,
          createdAt: nowIso, updatedAt: nowIso
        },
        {
          id: "activity-lecture", title: "人工智能与软件工程专题讲座", category: "讲座",
          description: "面向全校学生的专题讲座，介绍生成式人工智能在需求分析、编码和测试中的应用及工程边界。",
          location: "图书馆报告厅", startAt: addDays(10, 14), endAt: addDays(10, 16), registrationDeadline: addDays(7, 18),
          capacity: 1, organizerId: "user-teacher-demo", status: "published", requiresReview: true,
          eligibilityText: "限已完成程序设计基础课程的学生，报名后由活动教师审核。", suspendedAt: null, previousStatus: null,
          createdAt: nowIso, updatedAt: nowIso
        },
        {
          id: "activity-volunteer", title: "校园社团文化节", category: "文体活动",
          description: "各学生社团集中展示特色项目，现场设置互动体验、舞台展演和社团招新区域。",
          location: "大学生活动中心", startAt: addDays(15, 13), endAt: addDays(15, 18), registrationDeadline: addDays(12, 18),
          capacity: 1, organizerId: "user-teacher-demo", status: "published", requiresReview: false,
          eligibilityText: "全校学生均可报名。", suspendedAt: null, previousStatus: null,
          createdAt: nowIso, updatedAt: nowIso
        },
        {
          id: "activity-draft", title: "新生班级素质拓展", category: "素质拓展",
          description: "面向新生班级的团队协作活动，当前处于草稿阶段，待确认场地后发布。",
          location: "东区运动场", startAt: addDays(20, 9), endAt: addDays(20, 17), registrationDeadline: addDays(16, 18),
          capacity: 80, organizerId: "user-teacher-demo", status: "draft", requiresReview: false,
          eligibilityText: "限2026级新生。", suspendedAt: null, previousStatus: null,
          createdAt: nowIso, updatedAt: nowIso
        }
      ],
      registrations: [
        {
          id: "registration-demo-open", activityId: "activity-open-day", userId: "user-student-two",
          registeredAt: minutesAgo(120), status: "registered", statusUpdatedAt: minutesAgo(120),
          waitlistJoinedAt: null, reviewedAt: null, reviewedBy: null, decisionNote: ""
        },
        {
          id: "registration-demo-waitlist", activityId: "activity-open-day", userId: "user-student-three",
          registeredAt: minutesAgo(60), status: "waitlist", statusUpdatedAt: minutesAgo(60),
          waitlistJoinedAt: minutesAgo(60), reviewedAt: null, reviewedBy: null, decisionNote: ""
        },
        {
          id: "registration-demo-review", activityId: "activity-lecture", userId: "user-student-demo",
          registeredAt: minutesAgo(45), status: "pending", statusUpdatedAt: minutesAgo(45),
          waitlistJoinedAt: null, reviewedAt: null, reviewedBy: null, decisionNote: ""
        },
        {
          id: "registration-demo-lecture", activityId: "activity-lecture", userId: "user-student-two",
          registeredAt: minutesAgo(90), status: "registered", statusUpdatedAt: minutesAgo(90),
          waitlistJoinedAt: null, reviewedAt: minutesAgo(80), reviewedBy: "user-teacher-demo", decisionNote: "资格符合"
        },
        {
          id: "registration-demo-volunteer-wait", activityId: "activity-volunteer", userId: "user-student-three",
          registeredAt: minutesAgo(30), status: "waitlist", statusUpdatedAt: minutesAgo(30),
          waitlistJoinedAt: minutesAgo(30), reviewedAt: null, reviewedBy: null, decisionNote: ""
        }
      ],
      operationLogs: [
        { id: makeId("log"), operatorId: "user-teacher-demo", action: "seed", targetType: "system", targetId: "v2", detail: "初始化V2.0审核与候补演示数据", createdAt: nowIso }
      ]
    };
  }

  function migrateData(source) {
    var data = source || createSeedData();
    var seed = createSeedData();
    data.version = SCHEMA_VERSION;
    data.users = Array.isArray(data.users) ? data.users : seed.users;
    data.activities = Array.isArray(data.activities) ? data.activities : seed.activities;
    data.registrations = Array.isArray(data.registrations) ? data.registrations : [];
    data.operationLogs = Array.isArray(data.operationLogs) ? data.operationLogs : [];

    data.activities.forEach(function (activity) {
      if (typeof activity.requiresReview !== "boolean") activity.requiresReview = false;
      if (typeof activity.eligibilityText !== "string") activity.eligibilityText = "全校学生均可报名。";
      if (typeof activity.suspendedAt === "undefined") activity.suspendedAt = null;
      if (typeof activity.previousStatus === "undefined") activity.previousStatus = null;
    });

    data.registrations.forEach(function (registration) {
      if (!registration.status) registration.status = "registered";
      if (!registration.statusUpdatedAt) registration.statusUpdatedAt = registration.registeredAt || new Date().toISOString();
      if (typeof registration.waitlistJoinedAt === "undefined") registration.waitlistJoinedAt = registration.status === "waitlist" ? registration.statusUpdatedAt : null;
      if (typeof registration.reviewedAt === "undefined") registration.reviewedAt = null;
      if (typeof registration.reviewedBy === "undefined") registration.reviewedBy = null;
      if (typeof registration.decisionNote === "undefined") registration.decisionNote = "";
    });

    seed.users.forEach(function (seedUser) {
      if (!data.users.some(function (user) { return user.id === seedUser.id; })) data.users.push(seedUser);
    });
    seed.activities.forEach(function (seedActivity) {
      if (!data.activities.some(function (activity) { return activity.id === seedActivity.id; })) data.activities.push(seedActivity);
    });
    return data;
  }

  function readStorage(key) {
    try { return window.localStorage.getItem(key); }
    catch (error) { return memoryStorage[key] || null; }
  }

  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, value); }
    catch (error) { memoryStorage[key] = value; }
  }

  function removeStorage(key) {
    try { window.localStorage.removeItem(key); }
    catch (error) { delete memoryStorage[key]; }
  }

  var data = null;

  function init(forceReset) {
    if (data && !forceReset) return data;
    if (!forceReset) {
      var stored = readStorage(STORAGE_KEY);
      if (stored) {
        try { data = migrateData(JSON.parse(stored)); writeStorage(STORAGE_KEY, JSON.stringify(data)); return data; }
        catch (error) { removeStorage(STORAGE_KEY); }
      }
    }
    data = createSeedData();
    writeStorage(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function getData() { return init(false); }
  function save() { if (data) writeStorage(STORAGE_KEY, JSON.stringify(data)); }
  function reset() {
    removeStorage(STORAGE_KEY);
    removeStorage("campus-activity-system-session");
    data = createSeedData();
    writeStorage(STORAGE_KEY, JSON.stringify(data));
    return data;
  }
  function addLog(operatorId, action, targetType, targetId, detail) {
    var store = getData();
    store.operationLogs.unshift({
      id: makeId("log"), operatorId: operatorId || "system", action: action,
      targetType: targetType, targetId: targetId || "", detail: detail || "", createdAt: new Date().toISOString()
    });
    save();
  }

  window.CampusStore = {
    key: STORAGE_KEY,
    schemaVersion: SCHEMA_VERSION,
    init: init,
    getData: getData,
    save: save,
    reset: reset,
    addLog: addLog,
    makeId: makeId,
    encodePassword: encodePassword,
    migrate: migrateData,
    seed: createSeedData
  };
})();