(function () {
  "use strict";

  var DEFAULT_BASE_URL = "/api/v1";

  function createClient(baseUrl, fetchImpl) {
    var root = String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    var requestFetch = fetchImpl || window.fetch.bind(window);

    async function request(path, options) {
      var response = await requestFetch(root + path, Object.assign({
        headers: { "Content-Type": "application/json" }
      }, options || {}));
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        throw new Error(payload.message || "服务器请求失败。");
      }
      return payload;
    }

    return {
      login: function (username, password) {
        return request("/auth/login", { method: "POST", body: JSON.stringify({ username: username, password: password }) });
      },
      listActivities: function () {
        return request("/activities", { method: "GET" });
      },
      registerActivity: function (activityId) {
        return request("/activities/" + encodeURIComponent(activityId) + "/registrations", { method: "POST" });
      },
      cancelRegistration: function (activityId) {
        return request("/activities/" + encodeURIComponent(activityId) + "/registrations/current", { method: "DELETE" });
      }
    };
  }

  window.CampusServerApi = { createClient: createClient };
})();
