(function () {
  "use strict";

  var main = document.getElementById("main-content");
  var header = document.getElementById("site-header");
  var modalRoot = document.getElementById("modal-root");
  var toastRoot = document.getElementById("toast-container");
  var uiState = {
    filters: { keyword: "", category: "", status: "" }
  };

  var ROLE_LABELS = {
    student: "学生",
    teacher: "活动组织教师",
    admin: "系统管理员"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function routeName() {
    var hash = window.location.hash || "#/";
    return hash.replace(/^#\//, "").split("?")[0] || "home";
  }

  function roleLabel(role) {
    return ROLE_LABELS[role] || role;
  }

  function renderHeader() {
    var user = window.CampusAuth.currentUser();
    var links = [
      { href: "#/", label: "首页" },
      { href: "#/activities", label: "活动中心" }
    ];
    if (user && user.role === "student") links.push({ href: "#/my-registrations", label: "我的报名" });
    if (user && (user.role === "teacher" || user.role === "admin")) links.push({ href: "#/manage", label: "活动管理" });
    if (user && user.role === "admin") links.push({ href: "#/admin", label: "用户管理" });

    var current = routeName();
    var navHtml = links.map(function (link) {
      var target = link.href.replace("#/", "") || "home";
      return '<a class="nav-link' + (current === target ? " is-active" : "") + '" href="' + link.href + '">' + escapeHtml(link.label) + "</a>";
    }).join("");

    var accountHtml = user
      ? '<div class="user-badge"><strong>' + escapeHtml(user.displayName) + '</strong><span>' + escapeHtml(roleLabel(user.role)) + '</span></div><button class="btn btn-secondary" type="button" data-action="logout">退出</button>'
      : '<a class="btn btn-ghost" href="#/register">注册</a><a class="btn btn-primary" href="#/login">登录</a>';

    header.innerHTML = [
      '<div class="header-inner">',
      '  <a class="brand" href="#/"><span class="brand-mark">C</span><span><strong>校园活动管理系统</strong><small>V1.0 · 工程迭代实验</small></span></a>',
      '  <nav class="nav-links">' + navHtml + '</nav>',
      '  <div class="header-account">' + accountHtml + '</div>',
      '</div>'
    ].join("");
  }

  function statCard(label, value, hint) {
    return [
      '<article class="card stat-card">',
      '  <span class="muted small">' + escapeHtml(label) + '</span>',
      '  <div class="stat-value">' + escapeHtml(value) + '</div>',
      '  <span class="muted small">' + escapeHtml(hint) + '</span>',
      '</article>'
    ].join("");
  }

  function renderHome() {
    var summary = window.CampusActivities.summary();
    var user = window.CampusAuth.currentUser();
    main.innerHTML = [
      '<section class="hero">',
      '  <div class="hero-content">',
      '    <p class="eyebrow">Campus Activity System</p>',
      '    <h1>校园活动，从发布到报名形成完整闭环</h1>',
      '    <p>V1.0 面向学生、活动组织教师和系统管理员，提供活动查询、在线报名、活动管理与报名名单跟踪。</p>',
      '    <div class="hero-actions">',
      '      <a class="btn btn-primary" href="#/activities">进入活动中心</a>',
      user ? '      <a class="btn btn-secondary" href="' + (user.role === "student" ? "#/my-registrations" : "#/manage") + '">查看工作台</a>' : '      <a class="btn btn-secondary" href="#/login">登录系统</a>',
      '    </div>',
      '  </div>',
      '</section>',
      '<section class="section-block grid grid-4">',
      statCard("系统活动", summary.activities, "已纳入 V1.0"),
      statCard("正在报名", summary.published, "当前开放活动"),
      statCard("有效报名", summary.registrations, "系统累计记录"),
      statCard("有效用户", summary.users, "学生、教师与管理员"),
      '</section>',
      '<section class="section-block grid grid-3">',
      '  <article class="card"><span class="tag">需求</span><h3>活动信息服务</h3><p class="muted">集中展示活动时间、地点、容量和报名状态，减少信息分散和反复询问。</p></article>',
      '  <article class="card"><span class="tag">流程</span><h3>在线报名闭环</h3><p class="muted">支持报名、取消、容量校验和本人报名记录查看。</p></article>',
      '  <article class="card"><span class="tag">管理</span><h3>教师活动管理</h3><p class="muted">支持创建、编辑、发布、下线和报名名单导出。</p></article>',
      '</section>'
    ].join("");
  }

  function renderAuth(mode) {
    var isLogin = mode === "login";
    main.innerHTML = [
      '<section class="auth-layout">',
      '  <div class="auth-hero"><div><p class="eyebrow">Campus Activity System V1.0</p><h1>让校园活动的发布、参与和管理更清晰</h1><p>学生快速找到可报名活动，教师低成本发布并掌握名单，管理员保证账号和权限可控。</p></div><div class="auth-features"><div class="auth-feature"><strong>活动发现</strong><small>关键词、分类和状态筛选</small></div><div class="auth-feature"><strong>报名闭环</strong><small>报名、取消和状态跟踪</small></div><div class="auth-feature"><strong>角色权限</strong><small>三类角色分权控制</small></div></div></div>',
      '  <div class="card auth-card"><div class="auth-tabs"><button class="auth-tab' + (isLogin ? " is-active" : "") + '" type="button" data-action="auth-tab" data-mode="login">登录</button><button class="auth-tab' + (!isLogin ? " is-active" : "") + '" type="button" data-action="auth-tab" data-mode="register">学生注册</button></div>',
      isLogin ? renderLoginForm() : renderRegisterForm(),
      '  </div>',
      '</section>'
    ].join("");
  }

  function renderLoginForm() {
    return [
      '<h2>登录系统</h2><p class="muted small">使用账号登录后，系统将根据角色展示对应功能。</p>',
      '<form id="login-form" class="grid" novalidate>',
      '  <div class="field"><label for="login-username">用户名</label><input class="input" id="login-username" name="username" autocomplete="username" required></div>',
      '  <div class="field"><label for="login-password">密码</label><input class="input" id="login-password" name="password" type="password" autocomplete="current-password" required></div>',
      '  <button class="btn btn-primary" type="submit">登录</button>',
      '</form>',
      '<div class="notice" style="margin-top:18px">演示账号：学生 student / student123；教师 teacher / teacher123；管理员 admin / admin123</div>',
      '<div class="demo-accounts"><button class="demo-account" type="button" data-action="fill-login" data-username="student" data-password="student123">学生账号</button><button class="demo-account" type="button" data-action="fill-login" data-username="teacher" data-password="teacher123">教师账号</button><button class="demo-account" type="button" data-action="fill-login" data-username="admin" data-password="admin123">管理员账号</button></div>'
    ].join("");
  }

  function renderRegisterForm() {
    return [
      '<h2>注册学生账号</h2><p class="muted small">V1.0 开放学生自助注册，教师和管理员账号由系统预置。</p>',
      '<form id="register-form" class="grid" novalidate>',
      '  <div class="field"><label for="register-name">姓名</label><input class="input" id="register-name" name="displayName" maxlength="20" required></div>',
      '  <div class="field"><label for="register-username">用户名</label><input class="input" id="register-username" name="username" maxlength="20" placeholder="4～20位小写字母、数字或下划线" required></div>',
      '  <div class="field"><label for="register-password">密码</label><input class="input" id="register-password" name="password" type="password" minlength="6" required></div>',
      '  <div class="field"><label for="register-confirm">确认密码</label><input class="input" id="register-confirm" name="confirmPassword" type="password" minlength="6" required></div>',
      '  <button class="btn btn-primary" type="submit">注册并登录</button>',
      '</form>'
    ].join("");
  }

  function renderStatusBadge(status) {
    return '<span class="status status-' + escapeHtml(status) + '">' + escapeHtml(window.CampusActivities.statusLabel(status)) + '</span>';
  }

  function renderActivityCard(activity) {
    var user = window.CampusAuth.currentUser();
    var status = window.CampusActivities.effectiveStatus(activity);
    var count = window.CampusActivities.activeCount(activity.id);
    var percent = Math.min(100, Math.round(count / Number(activity.capacity) * 100));
    var registration = user ? window.CampusActivities.getRegistration(activity.id, user.id) : null;
    var actionHtml;

    if (registration && registration.status === "registered") {
      actionHtml = '<button class="btn btn-secondary" type="button" data-action="view-activity" data-id="' + escapeHtml(activity.id) + '">查看并管理</button>';
    } else if (!user) {
      actionHtml = '<a class="btn btn-primary" href="#/login">登录后报名</a>';
    } else {
      var state = window.CampusActivities.registrationState(activity, user);
      actionHtml = '<button class="btn ' + (state.allowed ? "btn-primary" : "btn-secondary") + '" type="button" data-action="view-activity" data-id="' + escapeHtml(activity.id) + '">' + (state.allowed ? "查看并报名" : "查看详情") + '</button>';
    }

    return [
      '<article class="card activity-card">',
      '  <div class="card-top"><span class="tag">' + escapeHtml(activity.category) + '</span>' + renderStatusBadge(status) + '</div>',
      '  <h3 style="margin-top:14px">' + escapeHtml(activity.title) + '</h3>',
      '  <p class="muted small">' + escapeHtml(activity.description) + '</p>',
      '  <div class="activity-meta">',
      '    <div class="meta-row"><strong>时间</strong><span>' + escapeHtml(window.CampusActivities.formatDateTime(activity.startAt)) + '</span></div>',
      '    <div class="meta-row"><strong>地点</strong><span>' + escapeHtml(activity.location) + '</span></div>',
      '    <div class="meta-row"><strong>容量</strong><span>' + count + ' / ' + activity.capacity + '<div class="progress"><span style="width:' + percent + '%"></span></div></span></div>',
      '  </div>',
      '  <div class="card-footer"><span class="muted small">报名截止 ' + escapeHtml(window.CampusActivities.formatDateTime(activity.registrationDeadline)) + '</span>' + actionHtml + '</div>',
      '</article>'
    ].join("");
  }

  function renderActivities() {
    var activities = window.CampusActivities.listVisibleActivities();
    var categories = activities.map(function (activity) { return activity.category; }).filter(function (value, index, list) { return list.indexOf(value) === index; });
    var filters = uiState.filters;
    var filtered = activities.filter(function (activity) {
      var status = window.CampusActivities.effectiveStatus(activity);
      var keyword = filters.keyword.toLowerCase();
      var matchesKeyword = !keyword || [activity.title, activity.location, activity.description, activity.category].join(" ").toLowerCase().indexOf(keyword) !== -1;
      return matchesKeyword && (!filters.category || activity.category === filters.category) && (!filters.status || status === filters.status);
    });

    main.innerHTML = [
      '<div class="page-heading"><div><h1>活动中心</h1><p>查看校内活动，筛选后完成报名或进入详情管理。</p></div></div>',
      '<form id="activity-filters" class="card filters" style="margin-bottom:22px">',
      '  <div class="field"><label for="filter-keyword">关键词</label><input class="input" id="filter-keyword" name="keyword" value="' + escapeHtml(filters.keyword) + '" placeholder="活动名称、地点或说明"></div>',
      '  <div class="field"><label for="filter-category">分类</label><select class="select" id="filter-category" name="category"><option value="">全部分类</option>' + categories.map(function (category) { return '<option value="' + escapeHtml(category) + '"' + (filters.category === category ? " selected" : "") + '>' + escapeHtml(category) + '</option>'; }).join("") + '</select></div>',
      '  <div class="field"><label for="filter-status">状态</label><select class="select" id="filter-status" name="status"><option value="">全部状态</option><option value="published"' + (filters.status === "published" ? " selected" : "") + '>正在报名</option><option value="closed"' + (filters.status === "closed" ? " selected" : "") + '>报名结束</option><option value="ended"' + (filters.status === "ended" ? " selected" : "") + '>已结束</option></select></div>',
      '  <button class="btn btn-secondary" type="submit">应用筛选</button>',
      '</form>',
      filtered.length ? '<section class="grid grid-3">' + filtered.map(renderActivityCard).join("") + '</section>' : '<section class="card empty-state">没有找到符合条件的活动，请调整筛选条件。</section>'
    ].join("");
  }

  function renderActivityDetail(activityId) {
    var activity = window.CampusActivities.getActivity(activityId);
    if (!activity) return showToast("活动不存在。", "error");
    var user = window.CampusAuth.currentUser();
    var status = window.CampusActivities.effectiveStatus(activity);
    var count = window.CampusActivities.activeCount(activity.id);
    var registration = user ? window.CampusActivities.getRegistration(activity.id, user.id) : null;
    var state = window.CampusActivities.registrationState(activity, user);
    var actionHtml = "";

    if (registration && registration.status === "registered") {
      actionHtml = '<button class="btn btn-soft-danger" type="button" data-action="cancel-registration" data-id="' + escapeHtml(activity.id) + '">取消报名</button>';
    } else if (user && state.allowed) {
      actionHtml = '<button class="btn btn-primary" type="button" data-action="register-activity" data-id="' + escapeHtml(activity.id) + '">确认报名</button>';
    } else if (!user) {
      actionHtml = '<a class="btn btn-primary" href="#/login">登录后报名</a>';
    }

    openModal(activity.title, [
      '<div class="grid grid-2">',
      '  <div><span class="muted small">活动分类</span><p>' + escapeHtml(activity.category) + '</p></div>',
      '  <div><span class="muted small">活动状态</span><p>' + renderStatusBadge(status) + '</p></div>',
      '  <div><span class="muted small">开始时间</span><p>' + escapeHtml(window.CampusActivities.formatDateTime(activity.startAt)) + '</p></div>',
      '  <div><span class="muted small">结束时间</span><p>' + escapeHtml(window.CampusActivities.formatDateTime(activity.endAt)) + '</p></div>',
      '  <div><span class="muted small">活动地点</span><p>' + escapeHtml(activity.location) + '</p></div>',
      '  <div><span class="muted small">报名名额</span><p>' + count + ' / ' + activity.capacity + '</p></div>',
      '</div>',
      '<div class="notice' + (state.allowed || (registration && registration.status === "registered") ? "" : " warning") + '" style="margin-top:18px">' + escapeHtml(registration && registration.status === "registered" ? "你已成功报名，请留意活动时间。" : state.reason) + '</div>',
      '<h3 style="margin-top:22px">活动说明</h3><p class="muted">' + escapeHtml(activity.description) + '</p>',
      '<p class="muted small">报名截止：' + escapeHtml(window.CampusActivities.formatDateTime(activity.registrationDeadline)) + '</p>'
    ].join(""), actionHtml + '<button class="btn btn-secondary" type="button" data-action="close-modal">关闭</button>');
  }

  function renderMyRegistrations() {
    var items = window.CampusActivities.getMyRegistrations();
    main.innerHTML = [
      '<div class="page-heading"><div><h1>我的报名</h1><p>查看报名结果、活动状态并管理尚未截止的报名。</p></div></div>',
      items.length ? [
        '<div class="table-wrap"><table><thead><tr><th>活动</th><th>活动时间</th><th>报名状态</th><th>活动状态</th><th>操作</th></tr></thead><tbody>',
        items.map(function (item) {
          var canCancel = item.registration.status === "registered" && window.CampusActivities.effectiveStatus(item.activity) === "published";
          return [
            '<tr>',
            '<td><strong>' + escapeHtml(item.activity.title) + '</strong><br><span class="muted small">' + escapeHtml(item.activity.location) + '</span></td>',
            '<td>' + escapeHtml(window.CampusActivities.formatDateTime(item.activity.startAt)) + '</td>',
            '<td>' + (item.registration.status === "registered" ? '<span class="status status-published">已报名</span>' : '<span class="status status-cancelled">已取消</span>') + '</td>',
            '<td>' + renderStatusBadge(window.CampusActivities.effectiveStatus(item.activity)) + '</td>',
            '<td>' + (canCancel ? '<button class="btn btn-soft-danger" type="button" data-action="cancel-registration" data-id="' + escapeHtml(item.activity.id) + '">取消报名</button>' : '<span class="muted small">无需操作</span>') + '</td>',
            '</tr>'
          ].join("");
        }).join(""),
        '</tbody></table></div>'
      ].join("") : '<section class="card empty-state"><h3>暂无报名记录</h3><p>前往活动中心报名后可在这里查看。</p><a class="btn btn-primary" href="#/activities">浏览活动</a></section>'
    ].join("");
  }

  function renderPlaceholder(title, message) {
    main.innerHTML = '<div class="page-heading"><div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(message) + '</p></div></div><section class="card empty-state">该功能将在下一开发阶段接入当前版本。</section>';
  }

  function renderNotFound() {
    main.innerHTML = '<section class="card empty-state"><h2>页面不存在或无权访问</h2><p>请通过顶部导航返回。</p><a class="btn btn-primary" href="#/">返回首页</a></section>';
  }

  function renderRoute() {
    renderHeader();
    var route = routeName();
    if (route === "home") return renderHome();
    if (route === "login") return renderAuth("login");
    if (route === "register") return renderAuth("register");
    if (route === "activities") return renderActivities();
    if (route === "my-registrations") return window.CampusAuth.hasRole(["student"]) ? renderMyRegistrations() : renderNotFound();
    if (route === "manage") return window.CampusAuth.hasRole(["teacher", "admin"]) ? renderPlaceholder("活动管理", "教师活动管理功能正在接入。") : renderNotFound();
    if (route === "admin") return window.CampusAuth.hasRole(["admin"]) ? renderPlaceholder("用户管理", "用户管理功能正在接入。") : renderNotFound();
    return renderNotFound();
  }

  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "");
    toast.textContent = message;
    toastRoot.appendChild(toast);
    window.setTimeout(function () { toast.remove(); }, 3200);
  }

  function openModal(title, bodyHtml, footerHtml) {
    modalRoot.innerHTML = [
      '<div class="modal-backdrop" data-action="modal-backdrop">',
      '  <section class="modal" role="dialog" aria-modal="true">',
      '    <header class="modal-header"><h2>' + escapeHtml(title) + '</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="关闭">×</button></header>',
      '    <div class="modal-body">' + bodyHtml + '</div>',
      footerHtml ? '    <footer class="modal-footer">' + footerHtml + '</footer>' : '',
      '  </section>',
      '</div>'
    ].join("");
  }

  function closeModal() {
    modalRoot.innerHTML = "";
  }

  function handleAction(action, target) {
    if (action === "logout") {
      window.CampusAuth.logout();
      showToast("已退出登录。", "success");
      window.location.hash = "#/";
      return;
    }
    if (action === "auth-tab") {
      window.location.hash = target.getAttribute("data-mode") === "login" ? "#/login" : "#/register";
      return;
    }
    if (action === "fill-login") {
      document.getElementById("login-username").value = target.getAttribute("data-username");
      document.getElementById("login-password").value = target.getAttribute("data-password");
      return;
    }
    if (action === "view-activity") {
      renderActivityDetail(target.getAttribute("data-id"));
      return;
    }
    if (action === "register-activity") {
      try {
        window.CampusActivities.register(target.getAttribute("data-id"));
        showToast("报名成功。", "success");
        closeModal();
        renderRoute();
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }
    if (action === "cancel-registration") {
      try {
        window.CampusActivities.cancelRegistration(target.getAttribute("data-id"));
        showToast("已取消报名。", "success");
        closeModal();
        renderRoute();
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }
    if (action === "close-modal") closeModal();
    if (action === "modal-backdrop" && target === target) closeModal();
  }

  function handleClick(event) {
    var target = event.target.closest("[data-action]");
    if (!target) return;
    if (target.getAttribute("data-action") === "modal-backdrop" && event.target !== target) return;
    handleAction(target.getAttribute("data-action"), target);
  }

  function handleSubmit(event) {
    if (event.target.id === "login-form") {
      event.preventDefault();
      var loginData = new FormData(event.target);
      try {
        var user = window.CampusAuth.login(loginData.get("username"), loginData.get("password"));
        showToast("欢迎回来，" + user.displayName + "。", "success");
        window.location.hash = "#/activities";
      } catch (error) {
        showToast(error.message, "error");
      }
    }
    if (event.target.id === "register-form") {
      event.preventDefault();
      var registerData = new FormData(event.target);
      try {
        var newUser = window.CampusAuth.register({
          displayName: registerData.get("displayName"),
          username: registerData.get("username"),
          password: registerData.get("password"),
          confirmPassword: registerData.get("confirmPassword")
        });
        showToast("注册成功，欢迎 " + newUser.displayName + "。", "success");
        window.location.hash = "#/activities";
      } catch (error) {
        showToast(error.message, "error");
      }
    }
    if (event.target.id === "activity-filters") {
      event.preventDefault();
      var filterData = new FormData(event.target);
      uiState.filters = {
        keyword: String(filterData.get("keyword") || "").trim(),
        category: String(filterData.get("category") || ""),
        status: String(filterData.get("status") || "")
      };
      renderActivities();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.CampusStore.init(false);
    renderRoute();
  });
  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  window.addEventListener("hashchange", renderRoute);

  window.CampusUI = {
    escapeHtml: escapeHtml,
    roleLabel: roleLabel,
    renderRoute: renderRoute,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    renderStatusBadge: renderStatusBadge
  };
})();
