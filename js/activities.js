(function () {
  "use strict";

  var ACTIVITY_STATUS_LABELS = { draft: "草稿", published: "已发布", closed: "已结束报名", cancelled: "已取消", suspended: "已下架", ended: "已结束" };
  var REGISTRATION_STATUS_LABELS = { pending: "待审核", registered: "已录取", waitlist: "候补中", rejected: "未通过", cancelled: "已取消" };
  var DATA = function () { return window.CampusStore.getData(); };
  var now = function () { return new Date(); };
  var toDate = function (value) { return value instanceof Date ? value : new Date(value); };

  function effectiveStatus(activity) {
    if (activity.status === "suspended") return "suspended";
    if (activity.status === "cancelled") return "cancelled";
    if (activity.status === "draft") return "draft";
    if (toDate(activity.endAt).getTime() <= now().getTime()) return "ended";
    if (activity.status === "closed") return "closed";
    return "published";
  }
  function activityStatusLabel(status) { return ACTIVITY_STATUS_LABELS[status] || status; }
  function registrationStatusLabel(status) { return REGISTRATION_STATUS_LABELS[status] || status; }
  function formatDateTime(value) {
    var date = toDate(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  }
  function getActivity(activityId) { return DATA().activities.find(function (item) { return item.id === activityId; }) || null; }
  function getOrganizer(activity) { return window.CampusAuth.findUserById(activity.organizerId); }
  function activeRegistrations(activityId) { return DATA().registrations.filter(function (item) { return item.activityId === activityId && item.status === "registered"; }); }
  function activeCount(activityId) { return activeRegistrations(activityId).length; }
  function waitlistRegistrations(activityId) {
    return DATA().registrations.filter(function (item) { return item.activityId === activityId && item.status === "waitlist"; }).sort(function (a, b) {
      return new Date(a.waitlistJoinedAt || a.registeredAt).getTime() - new Date(b.waitlistJoinedAt || b.registeredAt).getTime();
    });
  }
  function pendingRegistrations(activityId) {
    return DATA().registrations.filter(function (item) { return item.activityId === activityId && item.status === "pending"; }).sort(function (a, b) {
      return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
    });
  }
  function getRegistration(activityId, userId) {
    return DATA().registrations.find(function (item) { return item.activityId === activityId && item.userId === userId; }) || null;
  }
  function getWaitlistPosition(registration) {
    if (!registration || registration.status !== "waitlist") return null;
    var queue = waitlistRegistrations(registration.activityId);
    var index = queue.findIndex(function (item) { return item.id === registration.id; });
    return index === -1 ? null : index + 1;
  }
  function listVisibleActivities() {
    return DATA().activities.filter(function (activity) {
      var status = effectiveStatus(activity);
      return status !== "draft" && status !== "cancelled" && status !== "suspended";
    });
  }
  function listManageableActivities(actor) {
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    return DATA().activities.filter(function (activity) { return user.role === "admin" || activity.organizerId === user.id; }).slice().sort(function (a, b) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }
  function canManage(activity, actor) {
    var user = actor || window.CampusAuth.currentUser();
    return Boolean(user && activity && (user.role === "admin" || (user.role === "teacher" && activity.organizerId === user.id)));
  }
  function registrationState(activity, actor) {
    var user = actor || window.CampusAuth.currentUser();
    var status = effectiveStatus(activity);
    var existing = user ? getRegistration(activity.id, user.id) : null;
    var count = activeCount(activity.id);
    if (!user) return { allowed: false, resultStatus: null, reason: "请先登录学生账号" };
    if (user.role !== "student") return { allowed: false, resultStatus: null, reason: "仅学生账号可以报名" };
    if (status !== "published") return { allowed: false, resultStatus: null, reason: status === "draft" ? "活动尚未发布" : status === "suspended" ? "活动已下架" : "当前活动不接受报名" };
    if (toDate(activity.registrationDeadline).getTime() <= now().getTime()) return { allowed: false, resultStatus: null, reason: "报名已经截止" };
    if (existing) {
      if (existing.status === "registered") return { allowed: false, resultStatus: null, reason: "你已被录取" };
      if (existing.status === "pending") return { allowed: false, resultStatus: null, reason: "报名正在等待教师审核" };
      if (existing.status === "waitlist") return { allowed: false, resultStatus: null, reason: "你正在候补，当前排在第 " + getWaitlistPosition(existing) + " 位" };
      if (existing.status === "rejected") return { allowed: false, resultStatus: null, reason: "本次报名未通过审核" };
    }
    if (count >= Number(activity.capacity)) return { allowed: true, resultStatus: "waitlist", reason: "正式名额已满，可加入候补队列" };
    if (activity.requiresReview) return { allowed: true, resultStatus: "pending", reason: "该活动需要资格审核，提交后等待教师处理" };
    return { allowed: true, resultStatus: "registered", reason: "可以报名" };
  }
  function validateActivity(payload, existingActivity) {
    var title = String(payload.title || "").trim();
    var category = String(payload.category || "").trim();
    var description = String(payload.description || "").trim();
    var location = String(payload.location || "").trim();
    var eligibilityText = String(payload.eligibilityText || "").trim();
    var capacity = Number(payload.capacity);
    var start = toDate(payload.startAt), end = toDate(payload.endAt), deadline = toDate(payload.registrationDeadline);
    if (title.length < 2 || title.length > 50) throw new Error("活动名称长度需为 2～50 个字符。");
    if (!category) throw new Error("请选择活动分类。");
    if (description.length < 5 || description.length > 500) throw new Error("活动说明长度需为 5～500 个字符。");
    if (location.length < 2 || location.length > 50) throw new Error("活动地点长度需为 2～50 个字符。");
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) throw new Error("活动容量需为 1～500 的整数。");
    if (eligibilityText.length > 200) throw new Error("参加资格说明不能超过 200 个字符。");
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(deadline.getTime())) throw new Error("活动时间格式不正确。");
    if (start.getTime() <= now().getTime()) throw new Error("活动开始时间必须晚于当前时间。");
    if (end.getTime() <= start.getTime()) throw new Error("结束时间必须晚于开始时间。");
    if (deadline.getTime() > start.getTime()) throw new Error("报名截止时间不能晚于活动开始时间。");
    if (existingActivity && capacity < activeCount(existingActivity.id)) throw new Error("活动容量不能小于当前正式参加人数。");
    return {
      title: title, category: category, description: description, location: location,
      capacity: capacity, startAt: start.toISOString(), endAt: end.toISOString(), registrationDeadline: deadline.toISOString(),
      requiresReview: Boolean(payload.requiresReview), eligibilityText: eligibilityText || "全校学生均可报名。"
    };
  }
  function createActivity(payload, actor) {
    var user = window.CampusAuth.requireRole(["teacher"], actor);
    var values = validateActivity(payload, null);
    var activity = Object.assign({}, values, {
      id: window.CampusStore.makeId("activity"), organizerId: user.id,
      status: payload.status === "published" ? "published" : "draft", suspendedAt: null, previousStatus: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    DATA().activities.push(activity); window.CampusStore.save();
    window.CampusStore.addLog(user.id, "create", "activity", activity.id, "创建活动：" + activity.title);
    return activity;
  }
  function updateActivity(activityId, payload, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["teacher"], actor);
    if (!canManage(activity, user)) throw new Error("只能管理本人创建的活动。");
    Object.assign(activity, validateActivity(payload, activity), { updatedAt: new Date().toISOString() });
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "update", "activity", activity.id, "修改活动：" + activity.title);
    return activity;
  }
  function setActivityStatus(activityId, status, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["teacher"], actor);
    if (!canManage(activity, user)) throw new Error("只能管理本人创建的活动。");
    var allowed = { draft: ["published", "cancelled"], published: ["closed", "cancelled"], closed: ["published", "cancelled"], cancelled: ["draft"], suspended: ["draft"] };
    if (["draft", "published", "closed", "cancelled"].indexOf(status) === -1) throw new Error("活动状态不合法。");
    if ((allowed[activity.status] || []).indexOf(status) === -1) throw new Error("不能从当前状态直接变更为目标状态。");
    if (status === "published" && toDate(activity.endAt).getTime() <= now().getTime()) throw new Error("已经结束的活动不能重新发布。");
    activity.status = status; activity.updatedAt = new Date().toISOString(); window.CampusStore.save();
    window.CampusStore.addLog(user.id, "status", "activity", activity.id, "活动状态变更为 " + activityStatusLabel(status));
    return activity;
  }
  function suspendActivity(activityId, reason, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["admin"], actor);
    if (activity.status === "suspended") throw new Error("活动已经处于下架状态。");
    activity.previousStatus = activity.status; activity.status = "suspended"; activity.suspendedAt = new Date().toISOString();
    activity.suspendedReason = String(reason || "平台管理员下架").trim(); activity.updatedAt = new Date().toISOString();
    window.CampusStore.save(); window.CampusStore.addLog(user.id, "suspend", "activity", activity.id, "下架活动：" + activity.title + "；原因：" + activity.suspendedReason);
    return activity;
  }
  function restoreActivity(activityId, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["admin"], actor);
    if (activity.status !== "suspended") throw new Error("活动当前不是下架状态。");
    activity.status = activity.previousStatus && activity.previousStatus !== "suspended" ? activity.previousStatus : "draft";
    activity.previousStatus = null; activity.suspendedAt = null; activity.suspendedReason = ""; activity.updatedAt = new Date().toISOString();
    window.CampusStore.save(); window.CampusStore.addLog(user.id, "restore", "activity", activity.id, "恢复活动：" + activity.title);
    return activity;
  }
  function register(activityId, actor) {
    var user = window.CampusAuth.requireRole(["student"], actor);
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var state = registrationState(activity, user);
    if (!state.allowed) throw new Error(state.reason);
    var registration = getRegistration(activityId, user.id);
    var timestamp = new Date().toISOString();
    if (!registration) {
      registration = { id: window.CampusStore.makeId("registration"), activityId: activityId, userId: user.id, registeredAt: timestamp };
      DATA().registrations.push(registration);
    } else if (registration.status === "rejected") throw new Error("本次报名未通过审核，不能重复提交。");
    registration.status = state.resultStatus;
    registration.statusUpdatedAt = timestamp;
    registration.waitlistJoinedAt = state.resultStatus === "waitlist" ? timestamp : null;
    registration.reviewedAt = null; registration.reviewedBy = null; registration.decisionNote = "";
    delete registration.promotedAt;
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, state.resultStatus, "activity", activity.id, "提交报名：" + activity.title + "；结果：" + registrationStatusLabel(state.resultStatus));
    return registration;
  }
  function reviewRegistration(registrationId, decision, note, actor) {
    var user = window.CampusAuth.requireRole(["teacher"], actor);
    var registration = DATA().registrations.find(function (item) { return item.id === registrationId; });
    if (!registration) throw new Error("报名记录不存在。");
    var activity = getActivity(registration.activityId);
    if (!activity) throw new Error("活动不存在。");
    if (activity.organizerId !== user.id) throw new Error("只能审核本人负责活动的报名。");
    if (registration.status !== "pending") throw new Error("该报名当前不需要审核。");
    if (["approve", "reject"].indexOf(decision) === -1) throw new Error("审核决定不合法。");
    var timestamp = new Date().toISOString();
    registration.reviewedAt = timestamp; registration.reviewedBy = user.id; registration.decisionNote = String(note || "").trim();
    if (decision === "reject") registration.status = "rejected";
    else if (activeCount(activity.id) < Number(activity.capacity)) registration.status = "registered";
    else { registration.status = "waitlist"; registration.waitlistJoinedAt = timestamp; }
    registration.statusUpdatedAt = timestamp; window.CampusStore.save();
    window.CampusStore.addLog(user.id, "review-" + decision, "registration", registration.id, "审核报名：" + registrationStatusLabel(registration.status));
    return registration;
  }
  function promoteNextWaitlist(activityId, actorId) {
    var activity = getActivity(activityId);
    if (!activity || activeCount(activityId) >= Number(activity.capacity)) return null;
    var next = waitlistRegistrations(activityId)[0];
    if (!next) return null;
    next.status = "registered"; next.statusUpdatedAt = new Date().toISOString(); next.promotedAt = next.statusUpdatedAt;
    next.waitlistJoinedAt = null; window.CampusStore.save();
    window.CampusStore.addLog(actorId || "system", "promote", "registration", next.id, "候补递补为正式参加：" + activity.title);
    return next;
  }
  function cancelRegistration(activityId, actor) {
    var user = window.CampusAuth.requireRole(["student"], actor);
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var registration = getRegistration(activityId, user.id);
    if (!registration || ["registered", "pending", "waitlist"].indexOf(registration.status) === -1) throw new Error("没有可取消的有效报名或候补。");
    if (toDate(activity.registrationDeadline).getTime() <= now().getTime()) throw new Error("报名已经截止，不能取消。");
    var previous = registration.status;
    registration.status = "cancelled"; registration.statusUpdatedAt = new Date().toISOString(); registration.waitlistJoinedAt = null;
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "cancel", "activity", activity.id, "取消" + (previous === "waitlist" ? "候补：" : "报名：") + activity.title);
    var promoted = previous === "registered" ? promoteNextWaitlist(activityId, user.id) : null;
    return { registration: registration, previousStatus: previous, promoted: promoted };
  }
  function getMyRegistrations(actor) {
    var user = window.CampusAuth.requireRole(["student"], actor);
    return DATA().registrations.filter(function (item) { return item.userId === user.id; }).map(function (registration) {
      return { registration: registration, activity: getActivity(registration.activityId), waitlistPosition: getWaitlistPosition(registration) };
    }).filter(function (item) { return Boolean(item.activity); }).sort(function (a, b) { return new Date(b.registration.registeredAt).getTime() - new Date(a.registration.registeredAt).getTime(); });
  }
  function getRoster(activityId, actor) {
    var activity = getActivity(activityId);
    if (!activity) throw new Error("活动不存在。");
    var user = window.CampusAuth.requireRole(["teacher", "admin"], actor);
    if (!canManage(activity, user)) throw new Error("只能查看本人活动的报名名单。");
    var order = { registered: 0, pending: 1, waitlist: 2, rejected: 3, cancelled: 4 };
    return DATA().registrations.filter(function (item) { return item.activityId === activityId; }).map(function (registration) {
      return { registration: registration, user: window.CampusAuth.findUserById(registration.userId), waitlistPosition: getWaitlistPosition(registration) };
    }).filter(function (item) { return Boolean(item.user); }).sort(function (a, b) {
      var statusDiff = (order[a.registration.status] || 9) - (order[b.registration.status] || 9);
      if (statusDiff) return statusDiff;
      return new Date(a.registration.registeredAt).getTime() - new Date(b.registration.registeredAt).getTime();
    });
  }
  function exportRosterCsv(activityId, actor) {
    var activity = getActivity(activityId), rows = getRoster(activityId, actor);
    var lines = [["活动名称", activity.title], ["序号", "姓名", "用户名", "状态", "候补顺序", "提交时间", "审核备注"]];
    rows.forEach(function (item, index) {
      lines.push([String(index + 1), item.user.displayName, item.user.username, registrationStatusLabel(item.registration.status), item.waitlistPosition ? String(item.waitlistPosition) : "", formatDateTime(item.registration.registeredAt), item.registration.decisionNote || ""]);
    });
    return lines.map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
  }
  function summary() {
    var data = DATA();
    return {
      activities: data.activities.filter(function (activity) { return ["cancelled", "suspended"].indexOf(effectiveStatus(activity)) === -1; }).length,
      published: data.activities.filter(function (activity) { return effectiveStatus(activity) === "published"; }).length,
      registrations: data.registrations.filter(function (item) { return item.status === "registered"; }).length,
      waitlist: data.registrations.filter(function (item) { return item.status === "waitlist"; }).length,
      pending: data.registrations.filter(function (item) { return item.status === "pending"; }).length,
      users: data.users.filter(function (user) { return user.status === "active"; }).length
    };
  }

  window.CampusActivities = {
    statusLabel: activityStatusLabel, effectiveStatus: effectiveStatus, registrationStatusLabel: registrationStatusLabel,
    formatDateTime: formatDateTime, getActivity: getActivity, getOrganizer: getOrganizer,
    activeCount: activeCount, activeRegistrations: activeRegistrations, waitlistRegistrations: waitlistRegistrations,
    pendingRegistrations: pendingRegistrations, getWaitlistPosition: getWaitlistPosition, getRegistration: getRegistration,
    listVisibleActivities: listVisibleActivities, listManageableActivities: listManageableActivities,
    registrationState: registrationState, canManage: canManage, validateActivity: validateActivity,
    createActivity: createActivity, updateActivity: updateActivity, setActivityStatus: setActivityStatus,
    suspendActivity: suspendActivity, restoreActivity: restoreActivity, register: register,
    reviewRegistration: reviewRegistration, cancelRegistration: cancelRegistration,
    getMyRegistrations: getMyRegistrations, getRoster: getRoster, exportRosterCsv: exportRosterCsv, summary: summary
  };
})();