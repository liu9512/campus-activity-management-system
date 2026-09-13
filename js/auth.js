(function () {
  "use strict";

  var SESSION_KEY = "campus-activity-system-session";

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getSessionUserId() {
    try {
      return window.localStorage.getItem(SESSION_KEY);
    } catch (error) {
      return window.CampusStore.getData().sessionUserId || null;
    }
  }

  function setSessionUserId(userId) {
    var store = window.CampusStore.getData();
    store.sessionUserId = userId || null;
    window.CampusStore.save();
    try {
      if (userId) {
        window.localStorage.setItem(SESSION_KEY, userId);
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {
      // The store data still keeps a memory fallback for restricted browsers.
    }
  }

  function listUsers() {
    return window.CampusStore.getData().users.slice();
  }

  function findUserById(userId) {
    return listUsers().find(function (user) { return user.id === userId; }) || null;
  }

  function currentUser() {
    var userId = getSessionUserId() || window.CampusStore.getData().sessionUserId;
    var user = findUserById(userId);
    return user && user.status === "active" ? user : null;
  }

  function login(username, password) {
    var normalized = normalizeUsername(username);
    var user = listUsers().find(function (item) {
      return normalizeUsername(item.username) === normalized;
    });

    if (!user) {
      throw new Error("用户名或密码不正确。");
    }
    if (user.status !== "active") {
      throw new Error("该账号已被停用，请联系管理员。");
    }
    if (user.password !== window.CampusStore.encodePassword(password)) {
      throw new Error("用户名或密码不正确。");
    }

    setSessionUserId(user.id);
    window.CampusStore.addLog(user.id, "login", "user", user.id, "用户登录系统");
    return user;
  }

  function logout() {
    var user = currentUser();
    if (user) {
      window.CampusStore.addLog(user.id, "logout", "user", user.id, "用户退出系统");
    }
    setSessionUserId(null);
  }

  function register(payload) {
    var username = normalizeUsername(payload.username);
    var displayName = String(payload.displayName || "").trim();
    var password = String(payload.password || "");

    if (!/^[a-z0-9_]{4,20}$/.test(username)) {
      throw new Error("用户名需为 4～20 位小写字母、数字或下划线。");
    }
    if (displayName.length < 2 || displayName.length > 20) {
      throw new Error("姓名长度需为 2～20 个字符。");
    }
    if (password.length < 6) {
      throw new Error("密码至少需要 6 位。");
    }
    if (payload.confirmPassword !== password) {
      throw new Error("两次输入的密码不一致。");
    }
    if (listUsers().some(function (item) { return normalizeUsername(item.username) === username; })) {
      throw new Error("该用户名已被使用。");
    }

    var user = {
      id: window.CampusStore.makeId("user"),
      username: username,
      displayName: displayName,
      password: window.CampusStore.encodePassword(password),
      role: "student",
      status: "active",
      createdAt: new Date().toISOString()
    };

    var store = window.CampusStore.getData();
    store.users.push(user);
    window.CampusStore.save();
    window.CampusStore.addLog(user.id, "register", "user", user.id, "注册学生账号");
    setSessionUserId(user.id);
    return user;
  }

  function hasRole(roles, user) {
    var actor = user || currentUser();
    var allowed = Array.isArray(roles) ? roles : [roles];
    return Boolean(actor && allowed.indexOf(actor.role) !== -1);
  }

  function requireRole(roles, user) {
    var actor = user || currentUser();
    if (!actor) {
      throw new Error("请先登录后再执行该操作。");
    }
    if (!hasRole(roles, actor)) {
      throw new Error("当前账号没有执行该操作的权限。");
    }
    return actor;
  }

  function setUserStatus(userId, status) {
    var actor = requireRole(["admin"]);
    if (["active", "disabled"].indexOf(status) === -1) {
      throw new Error("账号状态不合法。");
    }
    if (actor.id === userId && status === "disabled") {
      throw new Error("管理员不能停用当前登录账号。");
    }

    var user = findUserById(userId);
    if (!user) {
      throw new Error("用户不存在。");
    }
    user.status = status;
    window.CampusStore.save();
    window.CampusStore.addLog(actor.id, "update-status", "user", user.id, "修改账号状态为 " + status);
    return user;
  }

  window.CampusAuth = {
    currentUser: currentUser,
    login: login,
    logout: logout,
    register: register,
    listUsers: listUsers,
    findUserById: findUserById,
    hasRole: hasRole,
    requireRole: requireRole,
    setUserStatus: setUserStatus,
    normalizeUsername: normalizeUsername
  };
})();
