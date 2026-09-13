(function () {
  "use strict";

  var STATUS_LABELS = {
    draft: "草稿",
    published: "已发布",
    closed: "已结束报名",
    cancelled: "已取消",
    ended: "已结束"
  };

  function now() {
    return new Date();
  }

  function toDate(value) {
    return value instanceof Date ? value : new Date(value);
  }

  function effectiveStatus(activity) {
    if (activity.status === "cancelled") return "cancelled";
    if (activity.status === "draft") return "draft";
    if (toDate(activity.endAt).getTime() <= now().getTime()) return "ended";
    if (activity.status === "closed") return "closed";
    return "published";
  }

  function statusLabel(status) {
    return STATUS_LABELS[status] || status;
  }

  function formatDateTime(value) {
    var date = toDate(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function getActivity(activityId) {
    return window.CampusStore.getData().activities.find(function (item) {
      return item.id === activityId;
    }) || null;
  }

  function getOrganizer(activity) {
    return window.CampusAuth.findUserById(activity.organizerId);
  }

  function activeRegistrations(activityId) {
    return window.CampusStore.getData().registrations.filter(function (registration) {
      return registration.activityId === activityId && registration.status === "registered";
    });
  }

  function activeCount(activityId) {
    return activeRegistrations(activityId).length;
  }

  function getRegistration(activityId, userId) {
    return window.CampusStore.getData().registrations.find(function (registration) {
      return registration.activityId === activityId && registration.userId === userId;
    }) || null;
  }

  function listVisibleActivities() {
    var data = window.CampusStore.getData();
    return data.activities.filter(function (activity) {
      var status = effectiveStatus(activity);
      return status !== "draft" && status !== "cancelled";
    });
  }

  function listManageableActivities(actor) {
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    return window.CampusStore.getData().activities.filter(function (activity) {
      return user.role === "admin" || activity.organizerId === user.id;
    }).slice().sort(function (a, b) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function registrationState(activity, actor) {
    var user = actor || window.CampusAuth.currentUser();
    var status = effectiveStatus(activity);
    var existing = user ? getRegistration(activity.id, user.id) : null;
    var count = activeCount(activity.id);

    if (!user) return { allowed: false, reason: "请先登录学生账号" };
    if (user.role !== "student") return { allowed: false, reason: "仅学生账号可以报名" };
    if (status !== "published") return { allowed: false, reason: status === "draft" ? "活动尚未发布" : "当前活动不接受报名" };
    if (toDate(activity.registrationDeadline).getTime() <= now().getTime()) return { allowed: false, reason: "报名已经截止" };
    if (existing && existing.status === "registered") return { allowed: false, reason: "你已经报名该活动" };
    if (count >= Number(activity.capacity)) return { allowed: false, reason: "活动名额已满" };
    return { allowed: true, reason: "可以报名" };
  }

  function validateActivity(payload, existingActivity) {
    var title = String(payload.title || "").trim();
    var category = String(payload.category || "").trim();
    var description = String(payload.description || "").trim();
    var location = String(payload.location || "").trim();
    var capacity = Number(payload.capacity);
    var start = toDate(payload.startAt);
    var end = toDate(payload.endAt);
    var deadline = toDate(payload.registrationDeadline);

    if (title.length < 2 || title.length > 50) throw new Error("活动名称长度需为 2～50 个字符。");
    if (!category) throw new Error("请选择活动分类。");
    if (description.length < 5 || description.length > 500) throw new Error("活动说明长度需为 5～500 个字符。");
    if (location.length < 2 || location.length > 50) throw new Error("活动地点长度需为 2～50 个字符。");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) throw new Error("活动容量需为 1～500 的整数。");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(deadline.getTime())) throw new Error("活动时间格式不正确。");
    if (start.getTime() <= now().getTime()) throw new Error("活动开始时间必须晚于当前时间。");
    if (end.getTime() <= start.getTime()) throw new Error("结束时间必须晚于开始时间。");
    if (deadline.getTime() > start.getTime()) throw new Error("报名截止时间不能晚于活动开始时间。");
    if (existingActivity && capacity < activeCount(existingActivity.id)) throw new Error("活动容量不能小于当前有效报名人数。");

    return {
      title: title,
      category: category,
      description: description,
      location: location,
      capacity: capacity,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      registrationDeadline: deadline.toISOString()
    };
  }

  function createActivity(payload, actor) {
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    var values = validateActivity(payload, null);
    var store = window.CampusStore.getData();
    var activity = Object.assign({}, values, {
      id: window.CampusStore.makeId("activity"),
      organizerId: user.id,
      status: payload.status === "published" ? "published" : "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    store.activities.push(activity);
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "create", "activity", activity.id, "创建活动：" + activity.title);
    return activity;
  }

  function canManage(activity, actor) {
    var user = actor || window.CampusAuth.currentUser();
    return Boolean(user && (user.role === "admin" || (user.role === "teacher" && activity.organizerId === user.id)));
  }

  function updateActivity(activityId, payload, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    if (!canManage(activity, user)) throw new Error("只能管理本人创建的活动。");
    var values = validateActivity(payload, activity);
    Object.assign(activity, values, { updatedAt: new Date().toISOString() });
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "update", "activity", activity.id, "修改活动：" + activity.title);
    return activity;
  }

  function setActivityStatus(activityId, status, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    if (!canManage(activity, user)) throw new Error("只能管理本人创建的活动。");
    var allowed = {
      draft: ["published", "cancelled"],
      published: ["closed", "cancelled"],
      closed: ["published", "cancelled"],
      cancelled: ["draft"]
    };
    if (["draft", "published", "closed", "cancelled"].indexOf(status) === -1) throw new Error("活动状态不合法。");
    if ((allowed[activity.status] || []).indexOf(status) === -1) throw new Error("不能从当前状态直接变更为目标状态。");
    if (status === "published" && toDate(activity.endAt).getTime() <= now().getTime()) throw new Error("已经结束的活动不能重新发布。");

    activity.status = status;
    activity.updatedAt = new Date().toISOString();
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "status", "activity", activity.id, "活动状态变更为 " + statusLabel(status));
    return activity;
  }

  function register(activityId, actor) {
    var user = window.CampusAuth.requireRole(["student"], actor);
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var state = registrationState(activity, user);
    if (!state.allowed) throw new Error(state.reason);

    var registration = getRegistration(activityId, user.id);
    if (registration) {
      registration.status = "registered";
      registration.registeredAt = new Date().toISOString();
    } else {
      registration = {
        id: window.CampusStore.makeId("registration"),
        activityId: activityId,
        userId: user.id,
        registeredAt: new Date().toISOString(),
        status: "registered"
      };
      window.CampusStore.getData().registrations.push(registration);
    }
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "register", "activity", activity.id, "报名活动：" + activity.title);
    return registration;
  }

  function cancelRegistration(activityId, actor) {
    var user = window.CampusAuth.requireRole(["student"], actor);
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var registration = getRegistration(activityId, user.id);
    if (!registration || registration.status !== "registered") throw new Error("没有可取消的有效报名。");
    if (toDate(activity.registrationDeadline).getTime() <= now().getTime()) throw new Error("报名已经截止，不能取消。");

    registration.status = "cancelled";
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "cancel", "activity", activity.id, "取消报名：" + activity.title);
    return registration;
  }

  function getMyRegistrations(actor) {
    var user = window.CampusAuth.requireRole(["student"], actor);
    return window.CampusStore.getData().registrations.filter(function (registration) {
      return registration.userId === user.id;
    }).map(function (registration) {
      return {
        registration: registration,
        activity: getActivity(registration.activityId)
      };
    }).filter(function (item) {
      return Boolean(item.activity);
    }).sort(function (a, b) {
      return new Date(b.registration.registeredAt).getTime() - new Date(a.registration.registeredAt).getTime();
    });
  }

  function getRoster(activityId, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    if (!canManage(activity, user)) throw new Error("只能查看本人活动的报名名单。");
    return activeRegistrations(activityId).map(function (registration) {
      return {
        registration: registration,
        user: window.CampusAuth.findUserById(registration.userId)
      };
    }).filter(function (item) { return Boolean(item.user); });
  }

  function exportRosterCsv(activityId, actor) {
    var activity = getActivity(activityId);
    var rows = getRoster(activityId, actor);
    var lines = [["活动名称", activity.title], ["序号", "姓名", "用户名", "报名时间"]];
    rows.forEach(function (item, index) {
      lines.push([String(index + 1), item.user.displayName, item.user.username, formatDateTime(item.registration.registeredAt)]);
    });
    return lines.map(function (row) {
      return row.map(function (cell) {
        return '"' + String(cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\r\n");
  }

  function summary() {
    var data = window.CampusStore.getData();
    return {
      activities: data.activities.filter(function (activity) { return effectiveStatus(activity) !== "cancelled"; }).length,
      published: data.activities.filter(function (activity) { return effectiveStatus(activity) === "published"; }).length,
      registrations: data.registrations.filter(function (registration) { return registration.status === "registered"; }).length,
      users: data.users.filter(function (user) { return user.status === "active"; }).length
    };
  }

  window.CampusActivities = {
    statusLabel: statusLabel,
    effectiveStatus: effectiveStatus,
    formatDateTime: formatDateTime,
    getActivity: getActivity,
    getOrganizer: getOrganizer,
    activeCount: activeCount,
    activeRegistrations: activeRegistrations,
    getRegistration: getRegistration,
    listVisibleActivities: listVisibleActivities,
    listManageableActivities: listManageableActivities,
    registrationState: registrationState,
    validateActivity: validateActivity,
    createActivity: createActivity,
    updateActivity: updateActivity,
    setActivityStatus: setActivityStatus,
    canManage: canManage,
    register: register,
    cancelRegistration: cancelRegistration,
    getMyRegistrations: getMyRegistrations,
    getRoster: getRoster,
    exportRosterCsv: exportRosterCsv,
    summary: summary
  };
})();
