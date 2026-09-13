(function () {
  "use strict";

  var main = document.getElementById("main-content");
  var header = document.getElementById("site-header");

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderHeader() {
    header.innerHTML = [
      '<div class="header-inner">',
      '  <a class="brand" href="#/">',
      '    <span class="brand-mark">C</span>',
      '    <span><strong>校园活动管理系统</strong><small>V1.0 · 工程迭代实验</small></span>',
      '  </a>',
      '  <nav class="nav-links"><a class="nav-link is-active" href="#/">系统首页</a></nav>',
      '  <div class="header-account"><span class="muted small">基础版本</span></div>',
      '</div>'
    ].join("");
  }

  function renderHome() {
    main.innerHTML = [
      '<section class="hero">',
      '  <div class="hero-content">',
      '    <p class="eyebrow">Campus Activity System</p>',
      '    <h1>校园活动，从发布到报名形成完整闭环</h1>',
      '    <p>V1.0 将面向学生、活动组织教师和系统管理员，逐步实现活动查询、在线报名、活动管理与名单跟踪。</p>',
      '    <div class="hero-actions">',
      '      <a class="btn btn-primary" href="#/activities">查看活动</a>',
      '      <a class="btn btn-secondary" href="#/login">登录系统</a>',
      '    </div>',
      '  </div>',
      '</section>',
      '<section class="section-block grid grid-3">',
      '  <article class="card"><span class="tag">需求</span><h3>活动信息服务</h3><p class="muted">集中展示活动时间、地点、容量和报名状态。</p></article>',
      '  <article class="card"><span class="tag">流程</span><h3>在线报名闭环</h3><p class="muted">支持报名、取消、容量校验和报名记录查看。</p></article>',
      '  <article class="card"><span class="tag">管理</span><h3>教师活动管理</h3><p class="muted">支持创建、编辑、发布、下线和名单导出。</p></article>',
      '</section>'
    ].join("");
  }

  function render() {
    renderHeader();
    renderHome();
  }

  document.addEventListener("DOMContentLoaded", function () {
    window.CampusStore.init(false);
    render();
  });

  window.CampusUI = {
    escapeHtml: escapeHtml,
    render: render
  };
})();
