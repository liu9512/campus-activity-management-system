(function () {
  "use strict";

  function getCategoryWeights(userId, activities, registrations) {
    var byId = {};
    activities.forEach(function (activity) { byId[activity.id] = activity; });
    return registrations.filter(function (registration) {
      return registration.userId === userId && registration.status === "registered";
    }).reduce(function (weights, registration) {
      var activity = byId[registration.activityId];
      if (activity) weights[activity.category] = (weights[activity.category] || 0) + 1;
      return weights;
    }, {});
  }

  function rankActivities(options) {
    var settings = options || {};
    var userId = settings.userId;
    var activities = settings.activities || [];
    var registrations = settings.registrations || [];
    var current = new Date(settings.now || Date.now()).getTime();
    var weights = getCategoryWeights(userId, activities, registrations);
    var registeredIds = registrations.filter(function (registration) {
      return registration.userId === userId && registration.status === "registered";
    }).map(function (registration) { return registration.activityId; });

    return activities.filter(function (activity) {
      if (activity.status !== "published") return false;
      if (registeredIds.indexOf(activity.id) !== -1) return false;
      if (new Date(activity.registrationDeadline).getTime() <= current) return false;
      var activeCount = registrations.filter(function (registration) {
        return registration.activityId === activity.id && registration.status === "registered";
      }).length;
      return activeCount < Number(activity.capacity);
    }).map(function (activity) {
      return {
        activity: activity,
        score: (weights[activity.category] || 0) * 10,
        startAt: new Date(activity.startAt).getTime()
      };
    }).sort(function (a, b) {
      return b.score - a.score || a.startAt - b.startAt;
    }).slice(0, Number(settings.limit || 5)).map(function (item) {
      return item.activity;
    });
  }

  window.CampusRecommendationExperiment = { rankActivities: rankActivities };
})();
