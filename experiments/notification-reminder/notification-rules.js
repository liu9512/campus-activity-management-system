(function () {
  "use strict";

  var DAY = 24 * 60 * 60 * 1000;

  function buildReminderPlan(options) {
    var settings = options || {};
    var userId = settings.userId;
    var activities = settings.activities || [];
    var registrations = settings.registrations || [];
    var current = new Date(settings.now || Date.now());
    var reminderWindowDays = Number(settings.reminderWindowDays || 3);

    if (!userId) return [];

    return registrations
      .filter(function (registration) {
        return registration.userId === userId && registration.status === "registered";
      })
      .map(function (registration) {
        return activities.find(function (activity) { return activity.id === registration.activityId; });
      })
      .filter(function (activity) {
        if (!activity || activity.status === "cancelled" || activity.status === "draft") return false;
        var start = new Date(activity.startAt).getTime();
        var distance = start - current.getTime();
        return distance > 0 && distance <= reminderWindowDays * DAY;
      })
      .sort(function (a, b) {
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      })
      .map(function (activity) {
        return {
          activityId: activity.id,
          title: activity.title,
          startAt: activity.startAt,
          level: new Date(activity.startAt).getTime() - current.getTime() <= DAY ? "urgent" : "normal",
          message: activity.title + " 将于 " + new Date(activity.startAt).toLocaleString("zh-CN") + " 开始。"
        };
      });
  }

  window.CampusNotificationExperiment = { buildReminderPlan: buildReminderPlan };
})();
