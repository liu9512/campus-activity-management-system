(function () {
  "use strict";

  var main = document.getElementById("main-content");
  var header = document.getElementById("site-header");
  var modalRoot = document.getElementById("modal-root");
  var toastRoot = document.getElementById("toast-container");

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

  function icon(name) {
    var icons = { user: "👤", activity: "📅", manage: "🗂", dashboard: "▦", test: "✓" };
    return icons[name] || "•";
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

    if (user && user.role === "student") {
      links.push({ href: "#/my-registrations", label: "我的报名" });
    }
    if (user && (user.role === "teacher" || user.role === "admin")) {
      links.push({ href: "#/manage", label: "活动管理" });
    }
    if (user && user.role === "admin") {
      links.push({ href: "#/admin", label: "用户管理" });
    }

    var current = routeName();
    var navHtml = links.map(function (link) {
      var target = link.href.replace("#/", "") || "home";
      var active = current === target ? " is-active" : "";
      return '<a class="nav-link' + active + '" href="' + link.href + '">' + escapeHtml(link.label) + "</a>";
    }).join("");

    var accountHtml;
    if (user) {
      accountHtml = [
        '<div class="user-badge"><strong>' + escapeHtml(user.displayName) + '</strong><span>' + escapeHtml(roleLabel(user.role)) + '</span></div>',
        '<button class="btn btn-secondary" type="button" data-action="logout">退出</button>'
      ].join("");
    } else {
      accountHtml = [
        '<a class="btn btn-ghost" href="#/register">注册</a>',
        '<a class="btn btn-primary" href="#/login">登录</a>'
      ].join("");
    }

    header.innerHTML = [
      '<div class="header-inner">',
      '  <a class="brand" href="#/">',
      '    <span class="brand-mark">C</span>',
      '    <span><strong>校园活动管理系统</strong><small>V1.0 · 工程迭代实验</small></span>',
      '  </a>',
      '  <nav class="nav-links">' + navHtml + '</nav>',
      '  <div class="header-account">' + accountHtml + '</div>',
      '</div>'
    ].join("");
  }

  function renderHome() {
    var user = window.CampusAuth.currentUser();
    main.innerHTML = [
      '<section class="hero">',
      '  <div class="hero-content">',
      '    <p class="eyebrow">Campus Activity System</p>',
      '    <h1>校园活动，从发布到报名形成完整闭环</h1>',
      '    <p>V1.0 面向学生、活动组织教师和系统管理员，提供活动查询、在线报名、活动管理与报名名单跟踪。</p>',
      '    <div class="hero-actions">',
      '      <a class="btn btn-primary" href="#/activities">进入活动中心</a>',
      user
        ? '      <a class="btn btn-secondary" href="' + (user.role === "student" ? "#/my-registrations" : "#/manage") + '">查看工作台</a>'
        : '      <a class="btn btn-secondary" href="#/login">登录系统</a>',
      '    </div>',
      '  </div>',
      '</section>',
      '<section class="section-block grid grid-3">',
      '  <article class="card"><span class="tag">需求</span><h3>活动信息服务</h3><p class="muted">集中展示活动时间、地点、容量和报名状态，减少信息分散和反复询问。</p></article>',
      '  <article class="card"><span class="tag">流程</span><h3>在线报名闭环</h3><p class="muted">支持报名、取消、容量校验和本人报名记录查看。</p></article>',
      '  <article class="card"><span class="tag">管理</span><h3>教师活动管理</h3><p class="muted">支持创建、编辑、发布、下线和报名名单导出。</p></article>',
      '</section>',
      '<section class="section-block card">',
      '  <h2>V1.0 版本边界</h2>',
      '  <div class="grid grid-3">',
      '    <div><strong>本轮实现</strong><p class="muted small">注册登录、角色权限、活动浏览、报名取消、教师管理、名单导出。</p></div>',
      '    <div><strong>暂不实现</strong><p class="muted small">支付、短信推送、现场签到、证书、评论聊天和个性化推荐。</p></div>',
      '    <div><strong>数据说明</strong><p class="muted small">当前版本使用浏览器本地存储，适合课程实验和单机演示。</p></div>',
      '  </div>',
      '</section>'
    ].join("");
  }

  function renderAuth(mode) {
    var isLogin = mode === "login";
    main.innerHTML = [
      '<section class="auth-layout">',
      '  <div class="auth-hero">',
      '    <div>',
      '      <p class="eyebrow">Campus Activity System V1.0</p>',
      '      <h1>让校园活动的发布、参与和管理更清晰</h1>',
      '      <p>学生快速找到可报名活动，教师低成本发布并掌握名单，管理员保证账号和权限可控。</p>',
      '    </div>',
      '    <div class="auth-features">',
      '      <div class="auth-feature"><strong>活动发现</strong><small>按关键词、分类和状态筛选</small></div>',
      '      <div class="auth-feature"><strong>报名闭环</strong><small>报名、取消和状态跟踪</small></div>',
      '      <div class="auth-feature"><strong>角色权限</strong><small>学生、教师、管理员分权</small></div>',
      '    </div>',
      '  </div>',
      '  <div class="card auth-card">',
      '    <div class="auth-tabs">',
      '      <button class="auth-tab' + (isLogin ? " is-active" : "") + '" type="button" data-action="auth-tab" data-mode="login">登录</button>',
      '      <button class="auth-tab' + (!isLogin ? " is-active" : "") + '" type="button" data-action="auth-tab" data-mode="register">学生注册</button>',
      '    </div>',
      isLogin ? renderLoginForm() : renderRegisterForm(),
      '  </div>',
      '</section>'
    ].join("");
  }

  function renderLoginForm() {
    return [
      '<h2>登录系统</h2>',
      '<p class="muted small">使用账号登录后，系统将根据角色展示对应功能。</p>',
      '<form id="login-form" class="grid" novalidate>',
      '  <div class="field"><label for="login-username">用户名</label><input class="input" id="login-username" name="username" autocomplete="username" required></div>',
      '  <div class="field"><label for="login-password">密码</label><input class="input" id="login-password" name="password" type="password" autocomplete="current-password" required></div>',
      '  <button class="btn btn-primary" type="submit">登录</button>',
      '</form>',
      '<div class="notice" style="margin-top:18px">演示账号：<br>学生 student / student123；教师 teacher / teacher123；管理员 admin / admin123</div>',
      '<div class="demo-accounts">',
      '  <button class="demo-account" type="button" data-action="fill-login" data-username="student" data-password="student123">填入学生账号</button>',
      '  <button class="demo-account" type="button" data-action="fill-login" data-username="teacher" data-password="teacher123">填入教师账号</button>',
      '  <button class="demo-account" type="button" data-action="fill-login" data-username="admin" data-password="admin123">填入管理员账号</button>',
      '</div>'
    ].join("");
  }

  function renderRegisterForm() {
    return [
      '<h2>注册学生账号</h2>',
      '<p class="muted small">V1.0 开放学生自助注册，教师和管理员账号由管理员创建或预置。</p>',
      '<form id="register-form" class="grid" novalidate>',
      '  <div class="field"><label for="register-name">姓名</label><input class="input" id="register-name" name="displayName" maxlength="20" required></div>',
      '  <div class="field"><label for="register-username">用户名</label><input class="input" id="register-username" name="username" maxlength="20" placeholder="4～20位小写字母、数字或下划线" required></div>',
      '  <div class="field"><label for="register-password">密码</label><input class="input" id="register-password" name="password" type="password" minlength="6" required></div>',
      '  <div class="field"><label for="register-confirm">确认密码</label><input class="input" id="register-confirm" name="confirmPassword" type="password" minlength="6" required></div>',
      '  <button class="btn btn-primary" type="submit">注册并登录</button>',
      '</form>'
    ].join("");
  }

  function renderPlaceholder(title, message) {
    main.innerHTML = [
      '<div class="page-heading"><div><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(message) + '</p></div></div>',
      '<section class="card empty-state">该功能将在下一开发阶段接入当前版本。</section>'
    ].join("");
  }

  function renderNotFound() {
    main.innerHTML = '<section class="card empty-state"><h2>页面不存在</h2><p>请通过顶部导航返回系统首页。</p><a class="btn btn-primary" href="#/">返回首页</a></section>';
  }

  function renderRoute() {
    renderHeader();
    var route = routeName();
    if (route === "home") return renderHome();
    if (route === "login") return renderAuth("login");
    if (route === "register") return renderAuth("register");
    if (route === "activities") return renderPlaceholder("活动中心", "浏览、筛选和报名功能正在接入。");
    if (route === "my-registrations") {
      if (!window.CampusAuth.hasRole(["student"])) return renderNotFound();
      return renderPlaceholder("我的报名", "报名记录功能正在接入。");
    }
    if (route === "manage") {
      if (!window.CampusAuth.hasRole(["teacher", "admin"])) return renderNotFound();
      return renderPlaceholder("活动管理", "教师活动管理功能正在接入。");
    }
    if (route === "admin") {
      if (!window.CampusAuth.hasRole(["admin"])) return renderNotFound();
      return renderPlaceholder("用户管理", "用户管理功能正在接入。");
    }
    return renderNotFound();
  }

  function showToast(message, type) {
    var toast = document.createElement("div");
    toast.className = "toast " + (type || "");
    toast.textContent = message;
    toastRoot.appendChild(toast);
    window.setTimeout(function () {
      toast.remove();
    }, 3200);
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

  function handleClick(event) {
    var target = event.target.closest("[data-action]");
    if (!target) return;
    var action = target.getAttribute("data-action");

    if (action === "logout") {
      window.CampusAuth.logout();
      showToast("已退出登录。", "success");
      window.location.hash = "#/";
      renderRoute();
    }

    if (action === "auth-tab") {
      window.location.hash = target.getAttribute("data-mode") === "login" ? "#/login" : "#/register";
    }

    if (action === "fill-login") {
      document.getElementById("login-username").value = target.getAttribute("data-username");
      document.getElementById("login-password").value = target.getAttribute("data-password");
    }

    if (action === "close-modal") {
      closeModal();
    }

    if (action === "modal-backdrop" && event.target === target) {
      closeModal();
    }
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
    icon: icon,
    renderRoute: renderRoute,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal
  };
})();
