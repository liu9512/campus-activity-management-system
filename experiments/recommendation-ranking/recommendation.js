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
    var activities = settings.activities || [];
    var registrations = settings.registrations || [];
    var weights = getCategoryWeights(settings.userId, activities, registrations);

    return activities.map(function (activity) {
      var weight = weights[activity.category] || 0;
      return { activity: activity, score: weight * 10 };
    }).sort(function (a, b) {
      return b.score - a.score;
    }).slice(0, Number(settings.limit || 5)).map(function (item) {
      return item.activity;
    });
  }

  window.CampusRecommendationExperiment = { rankActivities: rankActivities };
})();
