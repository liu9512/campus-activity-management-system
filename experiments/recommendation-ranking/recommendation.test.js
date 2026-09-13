(function () {
  "use strict";
  var now = new Date("2026-09-13T10:00:00+08:00").getTime();
  var future = function (days) { return new Date(now + days * 24 * 60 * 60 * 1000).toISOString(); };
  var activities = [
    { id: "a1", title: "喜欢的讲座", category: "讲座", status: "published", capacity: 10, registrationDeadline: future(3), startAt: future(5) },
    { id: "a2", title: "已报名讲座", category: "讲座", status: "published", capacity: 10, registrationDeadline: future(3), startAt: future(4) },
    { id: "a3", title: "满员志愿活动", category: "志愿活动", status: "published", capacity: 1, registrationDeadline: future(3), startAt: future(3) },
    { id: "a4", title: "已截止活动", category: "讲座", status: "published", capacity: 10, registrationDeadline: future(-1), startAt: future(2) }
  ];
  var registrations = [
    { activityId: "history", userId: "u1", status: "registered" },
    { activityId: "a2", userId: "u1", status: "registered" },
    { activityId: "a3", userId: "u2", status: "registered" }
  ];
  activities.push({ id: "history", title: "历史讲座", category: "讲座", status: "ended", capacity: 10, registrationDeadline: future(-10), startAt: future(-5) });
  var ranked = window.CampusRecommendationExperiment.rankActivities({ userId: "u1", activities: activities, registrations: registrations, now: now });
  if (ranked.length !== 1 || ranked[0].id !== "a1") throw new Error("推荐过滤结果不正确");
  document.body.setAttribute("data-test-status", "passed");
  document.getElementById("result").textContent = "通过：推荐结果排除已报名、满员、截止和未发布活动。";
})();
