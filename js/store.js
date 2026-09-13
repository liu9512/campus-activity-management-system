(function () {
  "use strict";

  var STORAGE_KEY = "campus-activity-system-v1";
  var memoryStorage = {};

  function makeId(prefix) {
    var random = Math.random().toString(36).slice(2, 9);
    return prefix + "-" + Date.now().toString(36) + "-" + random;
  }

  function addDays(days, hour) {
    var date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour || 10, 0, 0, 0);
    return date.toISOString();
  }

  function encodePassword(value) {
    try {
      return btoa(unescape(encodeURIComponent(String(value))));
    } catch (error) {
      return String(value);
    }
  }

  function createSeedData() {
    var teacherId = "user-teacher-demo";
    var studentId = "user-student-demo";
    var adminId = "user-admin-demo";
    var activityOne = "activity-open-day";
    var activityTwo = "activity-lecture";
    var activityThree = "activity-volunteer";
    var activityFour = "activity-draft";

    return {
      version: 1,
      users: [
        {
          id: adminId,
          username: "admin",
          displayName: "系统管理员",
          password: encodePassword("admin123"),
          role: "admin",
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: teacherId,
          username: "teacher",
          displayName: "李老师",
          password: encodePassword("teacher123"),
          role: "teacher",
          status: "active",
          createdAt: new Date().toISOString()
        },
        {
          id: studentId,
          username: "student",
          displayName: "演示学生",
          password: encodePassword("student123"),
          role: "student",
          status: "active",
          createdAt: new Date().toISOString()
        }
      ],
      activities: [
        {
          id: activityOne,
          title: "校园开放日志愿服务",
          category: "志愿活动",
          description: "协助来访同学完成校园路线引导、咨询答疑和秩序维护，结束后统一记录志愿服务时长。",
          location: "学校南门服务台",
          startAt: addDays(5, 9),
          endAt: addDays(5, 16),
          registrationDeadline: addDays(2, 18),
          capacity: 30,
          organizerId: teacherId,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: activityTwo,
          title: "人工智能与软件工程专题讲座",
          category: "讲座",
          description: "面向全校学生的专题讲座，介绍生成式人工智能在需求分析、编码和测试中的应用及工程边界。",
          location: "图书馆报告厅",
          startAt: addDays(10, 14),
          endAt: addDays(10, 16),
          registrationDeadline: addDays(7, 18),
          capacity: 120,
          organizerId: teacherId,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: activityThree,
          title: "校园社团文化节",
          category: "文体活动",
          description: "各学生社团集中展示特色项目，现场设置互动体验、舞台展演和社团招新区域。",
          location: "大学生活动中心",
          startAt: addDays(15, 13),
          endAt: addDays(15, 18),
          registrationDeadline: addDays(12, 18),
          capacity: 200,
          organizerId: teacherId,
          status: "published",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: activityFour,
          title: "新生班级素质拓展",
          category: "素质拓展",
          description: "面向新生班级的团队协作活动，当前处于草稿阶段，待确认场地后发布。",
          location: "东区运动场",
          startAt: addDays(20, 9),
          endAt: addDays(20, 17),
          registrationDeadline: addDays(16, 18),
          capacity: 80,
          organizerId: teacherId,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      registrations: [
        {
          id: "registration-demo-1",
          activityId: activityTwo,
          userId: studentId,
          registeredAt: new Date().toISOString(),
          status: "registered"
        }
      ],
      operationLogs: [
        {
          id: makeId("log"),
          operatorId: teacherId,
          action: "seed",
          targetType: "system",
          targetId: "v1",
          detail: "初始化演示活动数据",
          createdAt: new Date().toISOString()
        }
      ]
    };
  }

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return memoryStorage[key] || null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      memoryStorage[key] = value;
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      delete memoryStorage[key];
    }
  }

  var data = null;

  function init(forceReset) {
    if (data && !forceReset) {
      return data;
    }

    if (!forceReset) {
      var stored = readStorage(STORAGE_KEY);
      if (stored) {
        try {
          data = JSON.parse(stored);
          return data;
        } catch (error) {
          removeStorage(STORAGE_KEY);
        }
      }
    }

    data = createSeedData();
    writeStorage(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function getData() {
    return init(false);
  }

  function save() {
    if (!data) {
      return;
    }
    writeStorage(STORAGE_KEY, JSON.stringify(data));
  }

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
      id: makeId("log"),
      operatorId: operatorId || "system",
      action: action,
      targetType: targetType,
      targetId: targetId || "",
      detail: detail || "",
      createdAt: new Date().toISOString()
    });
    save();
  }

  window.CampusStore = {
    key: STORAGE_KEY,
    init: init,
    getData: getData,
    save: save,
    reset: reset,
    addLog: addLog,
    makeId: makeId,
    encodePassword: encodePassword,
    seed: createSeedData
  };
})();
