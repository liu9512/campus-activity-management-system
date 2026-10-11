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
      '  <a class="brand" href="#/"><span class="brand-mark">C</span><span><strong>校园活动管理系统</strong><small>V2.0 · 需求演化实验</small></span></a>',
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
      '    <p>V2.0 在活动发布、浏览和报名基础上，增加资格审核、候补队列、自动递补、状态透明化与平台活动监管。</p>',
      '    <div class="hero-actions">',
      '      <a class="btn btn-primary" href="#/activities">进入活动中心</a>',
      user ? '      <a class="btn btn-secondary" href="' + (user.role === "student" ? "#/my-registrations" : "#/manage") + '">查看工作台</a>' : '      <a class="btn btn-secondary" href="#/login">登录系统</a>',
      '    </div>',
      '  </div>',
      '</section>',
      '<section class="section-block grid grid-4">',
      statCard("系统活动", summary.activities, "已纳入 V2.0"),
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
      '  <div class="auth-hero"><div><p class="eyebrow">Campus Activity System V2.0</p><h1>让校园活动的发布、参与和管理更清晰</h1><p>学生快速找到可报名活动，教师低成本发布并掌握名单，管理员保证账号和权限可控。</p></div><div class="auth-features"><div class="auth-feature"><strong>活动发现</strong><small>关键词、分类和状态筛选</small></div><div class="auth-feature"><strong>报名闭环</strong><small>报名、取消和状态跟踪</small></div><div class="auth-feature"><strong>角色权限</strong><small>三类角色分权控制</small></div></div></div>',
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
      '<h2>注册学生账号</h2><p class="muted small">V2.0 开放学生自助注册，教师和管理员账号由系统预置。</p>',
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

  function renderRegistrationBadge(status) {
    return '<span class="status status-' + escapeHtml(status) + '">' + escapeHtml(window.CampusActivities.registrationStatusLabel(status)) + '</span>';
  }

  function renderActivityCard(activity) {
    var user = window.CampusAuth.currentUser();
    var status = window.CampusActivities.effectiveStatus(activity);
    var count = window.CampusActivities.activeCount(activity.id);
    var waitlistCount = window.CampusActivities.waitlistRegistrations(activity.id).length;
    var percent = Math.min(100, Math.round(count / Number(activity.capacity) * 100));
    var registration = user ? window.CampusActivities.getRegistration(activity.id, user.id) : null;
    var actionHtml;
    if (registration && ["registered", "pending", "waitlist"].indexOf(registration.status) !== -1) {
      actionHtml = '<button class="btn btn-secondary" type="button" data-action="view-activity" data-id="' + escapeHtml(activity.id) + '">查看当前状态</button>';
    } else if (!user) {
      actionHtml = '<a class="btn btn-primary" href="#/login">登录后报名</a>';
    } else {
      var state = window.CampusActivities.registrationState(activity, user);
      var label = state.resultStatus === "waitlist" ? "查看并加入候补" : state.resultStatus === "pending" ? "查看并提交审核" : state.allowed ? "查看并报名" : "查看详情";
      actionHtml = '<button class="btn ' + (state.allowed ? "btn-primary" : "btn-secondary") + '" type="button" data-action="view-activity" data-id="' + escapeHtml(activity.id) + '">' + label + '</button>';
    }
    return [
      '<article class="card activity-card">',
      '  <div class="card-top"><span class="tag">' + escapeHtml(activity.category) + '</span>' + renderStatusBadge(status) + '</div>',
      '  <h3 style="margin-top:14px">' + escapeHtml(activity.title) + '</h3>',
      '  <p class="muted small">' + escapeHtml(activity.description) + '</p>',
      '  <div class="activity-meta">',
      '    <div class="meta-row"><strong>时间</strong><span>' + escapeHtml(window.CampusActivities.formatDateTime(activity.startAt)) + '</span></div>',
      '    <div class="meta-row"><strong>地点</strong><span>' + escapeHtml(activity.location) + '</span></div>',
      '    <div class="meta-row"><strong>正式名额</strong><span>' + count + ' / ' + activity.capacity + '<div class="progress"><span style="width:' + percent + '%"></span></div></span></div>',
      '    <div class="meta-row"><strong>报名方式</strong><span>' + (activity.requiresReview ? "需资格审核" : "提交后直接录取或候补") + '</span></div>',
      '    <div class="meta-row"><strong>候补人数</strong><span>' + waitlistCount + ' 人</span></div>',
      '  </div>',
      '  <div class="notice small">参加资格：' + escapeHtml(activity.eligibilityText || "全校学生均可报名。") + '</div>',
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
    var waitlistCount = window.CampusActivities.waitlistRegistrations(activity.id).length;
    var pendingCount = window.CampusActivities.pendingRegistrations(activity.id).length;
    var registration = user ? window.CampusActivities.getRegistration(activity.id, user.id) : null;
    var state = window.CampusActivities.registrationState(activity, user);
    var actionHtml = "";
    if (registration && ["registered", "pending", "waitlist"].indexOf(registration.status) !== -1) {
      actionHtml = '<button class="btn btn-soft-danger" type="button" data-action="cancel-registration" data-id="' + escapeHtml(activity.id) + '">' + (registration.status === "waitlist" ? "退出候补" : "取消报名") + '</button>';
    } else if (user && state.allowed) {
      var label = state.resultStatus === "pending" ? "提交资格审核" : state.resultStatus === "waitlist" ? "加入候补队列" : "确认报名";
      actionHtml = '<button class="btn btn-primary" type="button" data-action="register-activity" data-id="' + escapeHtml(activity.id) + '">' + label + '</button>';
    } else if (!user) {
      actionHtml = '<a class="btn btn-primary" href="#/login">登录后报名</a>';
    }
    var currentMessage;
    if (registration && registration.status === "registered") currentMessage = "你已被录取为正式参加人员。";
    else if (registration && registration.status === "pending") currentMessage = "报名已提交，正在等待活动组织教师审核。";
    else if (registration && registration.status === "waitlist") currentMessage = "你正在候补，当前排在第 " + window.CampusActivities.getWaitlistPosition(registration) + " 位。";
    else if (registration && registration.status === "rejected") currentMessage = "本次报名未通过审核。" + (registration.decisionNote ? " 原因：" + registration.decisionNote : "");
    else currentMessage = state.reason;
    openModal(activity.title, [
      '<div class="grid grid-2">',
      '  <div><span class="muted small">活动分类</span><p>' + escapeHtml(activity.category) + '</p></div>',
      '  <div><span class="muted small">活动状态</span><p>' + renderStatusBadge(status) + '</p></div>',
      '  <div><span class="muted small">开始时间</span><p>' + escapeHtml(window.CampusActivities.formatDateTime(activity.startAt)) + '</p></div>',
      '  <div><span class="muted small">结束时间</span><p>' + escapeHtml(window.CampusActivities.formatDateTime(activity.endAt)) + '</p></div>',
      '  <div><span class="muted small">活动地点</span><p>' + escapeHtml(activity.location) + '</p></div>',
      '  <div><span class="muted small">正式名额</span><p>' + count + ' / ' + activity.capacity + '</p></div>',
      '  <div><span class="muted small">报名方式</span><p>' + (activity.requiresReview ? "需要资格审核" : "无需审核") + '</p></div>',
      '  <div><span class="muted small">候补 / 待审核</span><p>' + waitlistCount + ' 人 / ' + pendingCount + ' 人</p></div>',
      '</div>',
      '<div class="notice' + (state.allowed || (registration && ["registered", "pending", "waitlist"].indexOf(registration.status) !== -1) ? "" : " warning") + '" style="margin-top:18px">' + escapeHtml(currentMessage) + '</div>',
      '<h3 style="margin-top:22px">参加资格</h3><p class="muted">' + escapeHtml(activity.eligibilityText || "全校学生均可报名。") + '</p>',
      '<h3 style="margin-top:22px">活动说明</h3><p class="muted">' + escapeHtml(activity.description) + '</p>',
      '<p class="muted small">报名截止：' + escapeHtml(window.CampusActivities.formatDateTime(activity.registrationDeadline)) + '</p>'
    ].join(""), actionHtml + '<button class="btn btn-secondary" type="button" data-action="close-modal">关闭</button>');
  }
  function renderMyRegistrations() {
    var items = window.CampusActivities.getMyRegistrations();
    main.innerHTML = [
      '<div class="page-heading"><div><h1>我的报名</h1><p>查看审核结果、候补位置和正式录取状态。</p></div></div>',
      items.length ? [
        '<div class="table-wrap"><table><thead><tr><th>活动</th><th>活动时间</th><th>报名状态</th><th>状态说明</th><th>活动状态</th><th>操作</th></tr></thead><tbody>',
        items.map(function (item) {
          var reg = item.registration;
          var activityStatus = window.CampusActivities.effectiveStatus(item.activity);
          var canCancel = ["registered", "pending", "waitlist"].indexOf(reg.status) !== -1 && activityStatus === "published";
          var detail = reg.status === "waitlist" ? "当前候补第 " + item.waitlistPosition + " 位" : reg.status === "pending" ? "等待活动教师审核" : reg.status === "rejected" ? (reg.decisionNote || "未通过资格审核") : reg.status === "registered" ? "已获得正式名额" : "已取消";
          return '<tr><td><strong>' + escapeHtml(item.activity.title) + '</strong><br><span class="muted small">' + escapeHtml(item.activity.location) + '</span></td><td>' + escapeHtml(window.CampusActivities.formatDateTime(item.activity.startAt)) + '</td><td>' + renderRegistrationBadge(reg.status) + '</td><td>' + escapeHtml(detail) + '</td><td>' + renderStatusBadge(activityStatus) + '</td><td>' + (canCancel ? '<button class="btn btn-soft-danger" type="button" data-action="cancel-registration" data-id="' + escapeHtml(item.activity.id) + '">' + (reg.status === "waitlist" ? "退出候补" : "取消/撤回") + '</button>' : '<span class="muted small">无需操作</span>') + '</td></tr>';
        }).join(""),
        '</tbody></table></div>'
      ].join("") : '<section class="card empty-state"><h3>暂无报名记录</h3><p>前往活动中心报名后可在这里查看。</p><a class="btn btn-primary" href="#/activities">浏览活动</a></section>'
    ].join("");
  }
  function formatLocalInput(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    var pad = function (number) { return String(number).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate()) + "T" + pad(date.getHours()) + ":" + pad(date.getMinutes());
  }

  function activityFormHtml(activity) {
    var categories = ["讲座", "文体活动", "志愿活动", "素质拓展", "学术竞赛", "其他"];
    var value = activity || {};
    return [
      '<form id="activity-form" data-mode="' + (activity ? "edit" : "create") + '"' + (activity ? ' data-id="' + escapeHtml(activity.id) + '"' : '') + ' novalidate>',
      '  <div class="form-grid">',
      '    <div class="field full"><label for="activity-title">活动名称</label><input class="input" id="activity-title" name="title" maxlength="50" value="' + escapeHtml(value.title || "") + '" required></div>',
      '    <div class="field"><label for="activity-category">活动分类</label><select class="select" id="activity-category" name="category" required><option value="">请选择</option>' + categories.map(function (category) { return '<option value="' + escapeHtml(category) + '"' + (value.category === category ? " selected" : "") + '>' + escapeHtml(category) + '</option>'; }).join("") + '</select></div>',
      '    <div class="field"><label for="activity-capacity">正式参加上限</label><input class="input" id="activity-capacity" name="capacity" type="number" min="1" max="500" value="' + escapeHtml(value.capacity || 50) + '" required></div>',
      '    <div class="field full"><label for="activity-location">活动地点</label><input class="input" id="activity-location" name="location" maxlength="50" value="' + escapeHtml(value.location || "") + '" required></div>',
      '    <div class="field"><label for="activity-start">开始时间</label><input class="input" id="activity-start" name="startAt" type="datetime-local" value="' + escapeHtml(formatLocalInput(value.startAt)) + '" required></div>',
      '    <div class="field"><label for="activity-end">结束时间</label><input class="input" id="activity-end" name="endAt" type="datetime-local" value="' + escapeHtml(formatLocalInput(value.endAt)) + '" required></div>',
      '    <div class="field full"><label for="activity-deadline">报名截止时间</label><input class="input" id="activity-deadline" name="registrationDeadline" type="datetime-local" value="' + escapeHtml(formatLocalInput(value.registrationDeadline)) + '" required></div>',
      '    <div class="field full"><label for="activity-eligibility">参加资格说明</label><textarea class="textarea" id="activity-eligibility" name="eligibilityText" maxlength="200" placeholder="例如：限某年级、专业或需要满足前置条件">' + escapeHtml(value.eligibilityText || "全校学生均可报名。") + '</textarea></div>',
      '    <div class="field full"><label for="activity-description">活动说明</label><textarea class="textarea" id="activity-description" name="description" maxlength="500" required>' + escapeHtml(value.description || "") + '</textarea></div>',
      '    <label class="field full"><span><input type="checkbox" name="requiresReview"' + (value.requiresReview ? " checked" : "") + '> 报名需要教师审核资格</span></label>',
      activity ? '' : '    <label class="field full"><span><input type="checkbox" name="publishNow"> 保存后立即发布</span></label>',
      '  </div>',
      '</form>'
    ].join("");
  }
  function openActivityForm(activityId) {
    var activity = activityId ? window.CampusActivities.getActivity(activityId) : null;
    if (activityId && !activity) return showToast("活动不存在。", "error");
    openModal(activity ? "编辑活动" : "创建活动", activityFormHtml(activity), '<button class="btn btn-secondary" type="button" data-action="close-modal">取消</button><button class="btn btn-primary" type="submit" form="activity-form">保存活动</button>');
  }

  function renderManage() {
    var user = window.CampusAuth.currentUser();
    var isAdmin = user && user.role === "admin";
    var activities = window.CampusActivities.listManageableActivities();
    var active = activities.filter(function (activity) { return window.CampusActivities.effectiveStatus(activity) === "published"; }).length;
    var registrations = activities.reduce(function (total, activity) { return total + window.CampusActivities.activeCount(activity.id); }, 0);
    var pending = activities.reduce(function (total, activity) { return total + window.CampusActivities.pendingRegistrations(activity.id).length; }, 0);
    var waitlist = activities.reduce(function (total, activity) { return total + window.CampusActivities.waitlistRegistrations(activity.id).length; }, 0);
    main.innerHTML = [
      '<div class="page-heading"><div><h1>' + (isAdmin ? "活动监管" : "活动管理") + '</h1><p>' + (isAdmin ? "查看全部活动，并对违规或明显错误的平台活动执行下架和恢复。" : "创建、审核和发布本人活动，管理正式名单与候补队列。") + '</p></div>' + (isAdmin ? '' : '<button class="btn btn-primary" type="button" data-action="create-activity">创建活动</button>') + '</div>',
      '<section class="grid grid-4">', statCard("正在报名", active, "当前开放活动"), statCard("正式参加", registrations, "已占用名额"), statCard("待审核", pending, "需要教师处理"), statCard("候补人员", waitlist, "按进入时间排序"), '</section>',
      '<section class="section-block">',
      activities.length ? [
        '<div class="table-wrap"><table><thead><tr><th>活动</th><th>状态</th><th>正式 / 上限</th><th>待审核</th><th>候补</th><th>操作</th></tr></thead><tbody>',
        activities.map(function (activity) {
          var status = window.CampusActivities.effectiveStatus(activity);
          var actions = [];
          if (!isAdmin) {
            actions.push('<button class="btn btn-ghost" type="button" data-action="edit-activity" data-id="' + escapeHtml(activity.id) + '">编辑</button>');
            if (activity.status === "draft") actions.push('<button class="btn btn-ghost" type="button" data-action="publish-activity" data-id="' + escapeHtml(activity.id) + '">发布</button>');
            if (activity.status === "published") actions.push('<button class="btn btn-ghost" type="button" data-action="close-activity" data-id="' + escapeHtml(activity.id) + '">截止报名</button>');
            if (activity.status === "closed") actions.push('<button class="btn btn-ghost" type="button" data-action="publish-activity" data-id="' + escapeHtml(activity.id) + '">重新发布</button>');
            if (activity.status === "cancelled") actions.push('<button class="btn btn-ghost" type="button" data-action="restore-draft" data-id="' + escapeHtml(activity.id) + '">恢复草稿</button>');
            if (activity.status !== "cancelled" && status !== "ended") actions.push('<button class="btn btn-soft-danger" type="button" data-action="cancel-activity" data-id="' + escapeHtml(activity.id) + '">取消活动</button>');
          } else if (activity.status === "suspended") {
            actions.push('<button class="btn btn-ghost" type="button" data-action="restore-activity" data-id="' + escapeHtml(activity.id) + '">恢复活动</button>');
          } else {
            actions.push('<button class="btn btn-soft-danger" type="button" data-action="suspend-activity" data-id="' + escapeHtml(activity.id) + '">下架</button>');
          }
          actions.push('<button class="btn btn-ghost" type="button" data-action="view-roster" data-id="' + escapeHtml(activity.id) + '">名单</button>');
          return '<tr><td><strong>' + escapeHtml(activity.title) + '</strong><br><span class="muted small">' + escapeHtml(activity.category) + ' · ' + escapeHtml(activity.location) + '</span></td><td>' + renderStatusBadge(status) + '</td><td>' + window.CampusActivities.activeCount(activity.id) + ' / ' + activity.capacity + '</td><td>' + window.CampusActivities.pendingRegistrations(activity.id).length + '</td><td>' + window.CampusActivities.waitlistRegistrations(activity.id).length + '</td><td>' + actions.join(" ") + '</td></tr>';
        }).join(""),
        '</tbody></table></div>'
      ].join("") : '<div class="card empty-state">还没有活动。</div>',
      '</section>'
    ].join("");
  }
  function renderRoster(activityId) {
    var activity = window.CampusActivities.getActivity(activityId);
    if (!activity) return showToast("活动不存在。", "error");
    var rows;
    try { rows = window.CampusActivities.getRoster(activityId); }
    catch (error) { return showToast(error.message, "error"); }
    var formal = rows.filter(function (item) { return item.registration.status === "registered"; }).length;
    var pending = rows.filter(function (item) { return item.registration.status === "pending"; }).length;
    var waiting = rows.filter(function (item) { return item.registration.status === "waitlist"; }).length;
    openModal(activity.title + " · 报名处理", [
      '<div class="grid grid-3"><div class="notice">正式参加：' + formal + ' / ' + activity.capacity + '</div><div class="notice warning">待审核：' + pending + '</div><div class="notice">候补队列：' + waiting + '</div></div>',
      rows.length ? '<div class="table-wrap section"><table><thead><tr><th>姓名</th><th>状态</th><th>候补顺序</th><th>提交时间</th><th>审核备注</th><th>操作</th></tr></thead><tbody>' + rows.map(function (item) {
        var reg = item.registration;
        var canReview = window.CampusAuth.currentUser().role === "teacher" && activity.organizerId === window.CampusAuth.currentUser().id;
        var actions = reg.status === "pending" && canReview ? '<button class="btn btn-success" type="button" data-action="review-registration" data-id="' + escapeHtml(reg.id) + '" data-decision="approve">通过</button> <button class="btn btn-soft-danger" type="button" data-action="review-registration" data-id="' + escapeHtml(reg.id) + '" data-decision="reject">拒绝</button>' : '<span class="muted small">—</span>';
        return '<tr><td><strong>' + escapeHtml(item.user.displayName) + '</strong><br><span class="muted small">' + escapeHtml(item.user.username) + '</span></td><td>' + renderRegistrationBadge(reg.status) + '</td><td>' + (item.waitlistPosition || "—") + '</td><td>' + escapeHtml(window.CampusActivities.formatDateTime(reg.registeredAt)) + '</td><td>' + escapeHtml(reg.decisionNote || "—") + '</td><td>' + actions + '</td></tr>';
      }).join("") + '</tbody></table></div>' : '<div class="empty-state">当前还没有报名记录。</div>'
    ].join(""), '<button class="btn btn-secondary" type="button" data-action="close-modal">关闭</button><button class="btn btn-primary" type="button" data-action="export-roster" data-id="' + escapeHtml(activity.id) + '">导出 CSV</button>');
  }
  function downloadRoster(activityId) {
    try {
      var activity = window.CampusActivities.getActivity(activityId);
      var csv = window.CampusActivities.exportRosterCsv(activityId);
      var blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = activity.title + "-报名名单.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showToast("报名名单已导出。", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  function renderAdmin() {
    var users = window.CampusAuth.listUsers();
    var activities = window.CampusActivities.listManageableActivities();
    var logs = window.CampusStore.getData().operationLogs.slice(0, 18);
    main.innerHTML = [
      '<div class="page-heading"><div><h1>平台管理</h1><p>维护账号权限，并监管全部活动状态；不介入具体报名审核。</p></div><button class="btn btn-soft-danger" type="button" data-action="reset-demo">重置演示数据</button></div>',
      '<section class="section-block"><div class="section-title"><h2>用户与角色</h2></div><div class="table-wrap"><table><thead><tr><th>姓名</th><th>用户名</th><th>角色</th><th>状态</th><th>操作</th></tr></thead><tbody>',
      users.map(function (user) {
        var nextStatus = user.status === "active" ? "disabled" : "active";
        return '<tr><td>' + escapeHtml(user.displayName) + '</td><td>' + escapeHtml(user.username) + '</td><td>' + escapeHtml(roleLabel(user.role)) + '</td><td>' + (user.status === "active" ? '<span class="status status-published">正常</span>' : '<span class="status status-cancelled">已停用</span>') + '</td><td><button class="btn btn-ghost" type="button" data-action="toggle-user-status" data-id="' + escapeHtml(user.id) + '" data-status="' + nextStatus + '">' + (nextStatus === "disabled" ? "停用" : "启用") + '</button></td></tr>';
      }).join(""),
      '</tbody></table></div></section>',
      '<section class="section-block"><div class="section-title"><h2>活动状态监管</h2></div><div class="table-wrap"><table><thead><tr><th>活动</th><th>负责人</th><th>状态</th><th>正式 / 候补 / 待审核</th><th>操作</th></tr></thead><tbody>',
      activities.map(function (activity) {
        var organizer = window.CampusActivities.getOrganizer(activity);
        var status = window.CampusActivities.effectiveStatus(activity);
        var action = activity.status === "suspended" ? '<button class="btn btn-ghost" type="button" data-action="restore-activity" data-id="' + escapeHtml(activity.id) + '">恢复</button>' : '<button class="btn btn-soft-danger" type="button" data-action="suspend-activity" data-id="' + escapeHtml(activity.id) + '">下架</button>';
        return '<tr><td>' + escapeHtml(activity.title) + '<br><span class="muted small">' + escapeHtml(activity.eligibilityText || "") + '</span></td><td>' + escapeHtml(organizer ? organizer.displayName : "未知") + '</td><td>' + renderStatusBadge(status) + '</td><td>' + window.CampusActivities.activeCount(activity.id) + ' / ' + window.CampusActivities.waitlistRegistrations(activity.id).length + ' / ' + window.CampusActivities.pendingRegistrations(activity.id).length + '</td><td>' + action + '</td></tr>';
      }).join(""),
      '</tbody></table></div></section>',
      '<section class="section-block card"><h2>最近操作记录</h2>',
      logs.length ? '<ul class="list-clean">' + logs.map(function (log) { var operator = window.CampusAuth.findUserById(log.operatorId); return '<li><strong>' + escapeHtml(operator ? operator.displayName : "系统") + '</strong> · ' + escapeHtml(log.detail) + '<br><span class="muted small">' + escapeHtml(window.CampusActivities.formatDateTime(log.createdAt)) + '</span></li>'; }).join("") + '</ul>' : '<p class="muted">暂无操作记录。</p>',
      '</section>'
    ].join("");
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
    if (route === "manage") return window.CampusAuth.hasRole(["teacher", "admin"]) ? renderManage() : renderNotFound();
    if (route === "admin") return window.CampusAuth.hasRole(["admin"]) ? renderAdmin() : renderNotFound();
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
        var registration = window.CampusActivities.register(target.getAttribute("data-id"));
        var message = registration.status === "pending" ? "报名已提交，等待教师审核。" : registration.status === "waitlist" ? "已加入候补队列。" : "报名成功，已获得正式名额。";
        showToast(message, "success");
        closeModal();
        renderRoute();
      } catch (error) { showToast(error.message, "error"); }
      return;
    }
    if (action === "cancel-registration") {
      try {
        var cancelResult = window.CampusActivities.cancelRegistration(target.getAttribute("data-id"));
        var cancelMessage = cancelResult.promoted ? "操作成功，已按顺序递补候补人员。" : cancelResult.previousStatus === "waitlist" ? "已退出候补。" : "已取消报名。";
        showToast(cancelMessage, "success");
        closeModal();
        renderRoute();
      } catch (error) { showToast(error.message, "error"); }
      return;
    }
    if (action === "create-activity") {
      openActivityForm(null);
      return;
    }
    if (action === "edit-activity") {
      openActivityForm(target.getAttribute("data-id"));
      return;
    }
    if (["publish-activity", "close-activity", "cancel-activity", "restore-draft"].indexOf(action) !== -1) {
      var nextStatus = action === "publish-activity" ? "published" : action === "close-activity" ? "closed" : action === "cancel-activity" ? "cancelled" : "draft";
      try {
        window.CampusActivities.setActivityStatus(target.getAttribute("data-id"), nextStatus);
        showToast("活动状态已更新。", "success");
        renderRoute();
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }
    if (action === "review-registration") {
      try {
        var reg = window.CampusStore.getData().registrations.find(function (item) { return item.id === target.getAttribute("data-id"); });
        var decision = target.getAttribute("data-decision");
        window.CampusActivities.reviewRegistration(target.getAttribute("data-id"), decision, decision === "reject" ? "未通过资格审核" : "资格审核通过", window.CampusAuth.currentUser());
        showToast(decision === "approve" ? "已通过报名审核。" : "已拒绝报名申请。", "success");
        renderRoster(reg.activityId);
      } catch (error) { showToast(error.message, "error"); }
      return;
    }
    if (action === "suspend-activity") {
      var reason = window.prompt("请输入活动下架原因：", "活动信息不符合平台管理要求");
      if (reason !== null) {
        try { window.CampusActivities.suspendActivity(target.getAttribute("data-id"), reason, window.CampusAuth.currentUser()); showToast("活动已下架。", "success"); renderRoute(); }
        catch (error) { showToast(error.message, "error"); }
      }
      return;
    }
    if (action === "restore-activity") {
      try { window.CampusActivities.restoreActivity(target.getAttribute("data-id"), window.CampusAuth.currentUser()); showToast("活动已恢复。", "success"); renderRoute(); }
      catch (error) { showToast(error.message, "error"); }
      return;
    }    if (action === "view-roster") {
      renderRoster(target.getAttribute("data-id"));
      return;
    }
    if (action === "export-roster") {
      downloadRoster(target.getAttribute("data-id"));
      return;
    }
    if (action === "toggle-user-status") {
      try {
        window.CampusAuth.setUserStatus(target.getAttribute("data-id"), target.getAttribute("data-status"));
        showToast("账号状态已更新。", "success");
        renderRoute();
      } catch (error) {
        showToast(error.message, "error");
      }
      return;
    }
    if (action === "reset-demo") {
      if (window.confirm("确定重置所有演示数据吗？当前注册、报名和活动修改都会被清除。")) {
        window.CampusStore.reset();
        showToast("演示数据已重置。", "success");
        renderRoute();
      }
      return;
    }    if (action === "close-modal") closeModal();
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

    if (event.target.id === "activity-form") {
      event.preventDefault();
      var activityData = new FormData(event.target);
      var payload = {
        title: activityData.get("title"),
        category: activityData.get("category"),
        capacity: activityData.get("capacity"),
        location: activityData.get("location"),
        startAt: activityData.get("startAt"),
        endAt: activityData.get("endAt"),
        registrationDeadline: activityData.get("registrationDeadline"),
        description: activityData.get("description"),
        requiresReview: Boolean(activityData.get("requiresReview")),
        eligibilityText: activityData.get("eligibilityText"),
        status: activityData.get("publishNow") ? "published" : "draft"
      };
      try {
        if (event.target.getAttribute("data-mode") === "edit") {
          window.CampusActivities.updateActivity(event.target.getAttribute("data-id"), payload);
          showToast("活动已更新。", "success");
        } else {
          window.CampusActivities.createActivity(payload);
          showToast(payload.status === "published" ? "活动已创建并发布。" : "活动已保存为草稿。", "success");
        }
        closeModal();
        renderRoute();
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
    renderRoute: renderRoute,
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    renderStatusBadge: renderStatusBadge
  };
})();






