(function () {
  "use strict";
  var base = new Date("2026-09-13T10:00:00+08:00").getTime();
  var activities = [
    { id: "a1", title: "明天活动", startAt: new Date(base + 24 * 60 * 60 * 1000).toISOString(), status: "published" },
    { id: "a2", title: "五天后活动", startAt: new Date(base + 5 * 24 * 60 * 60 * 1000).toISOString(), status: "published" },
    { id: "a3", title: "已取消活动", startAt: new Date(base + 2 * 24 * 60 * 60 * 1000).toISOString(), status: "cancelled" }
  ];
  var registrations = [
    { activityId: "a1", userId: "u1", status: "registered" },
    { activityId: "a2", userId: "u1", status: "registered" },
    { activityId: "a3", userId: "u1", status: "registered" }
  ];
  var plan = window.CampusNotificationExperiment.buildReminderPlan({ userId: "u1", activities: activities, registrations: registrations, now: base, reminderWindowDays: 3 });
  if (plan.length !== 1) throw new Error("提醒数量不正确");
  if (plan[0].activityId !== "a1") throw new Error("提醒活动筛选不正确");
  if (plan[0].level !== "urgent") throw new Error("紧急级别不正确");
  document.body.setAttribute("data-test-status", "passed");
  document.getElementById("result").textContent = "通过：提醒时间窗口、取消活动排除和紧急级别均正确。";
})();
