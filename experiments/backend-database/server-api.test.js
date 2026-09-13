(function () {
  "use strict";

  var calls = [];
  var mockFetch = async function (url, options) {
    calls.push({ url: url, options: options || {} });
    return { ok: true, json: async function () { return { success: true }; } };
  };

  async function run() {
    var client = window.CampusServerApi.createClient("https://example.test/api/v1", mockFetch);
    await client.login("student", "student123");
    await client.listActivities();
    await client.registerActivity("activity-1");
    await client.cancelRegistration("activity-1");

    if (calls.length !== 4) throw new Error("接口调用数量不正确");
    if (calls[0].url !== "https://example.test/api/v1/auth/login") throw new Error("登录接口地址不正确");
    if (calls[2].url !== "https://example.test/api/v1/activities/activity-1/registrations") throw new Error("报名接口地址不正确");
    if (calls[3].options.method !== "DELETE") throw new Error("取消报名方法不正确");

    document.body.setAttribute("data-test-status", "passed");
    document.getElementById("result").textContent = "通过：4 个后端 API 契约均符合预期。";
  }

  run().catch(function (error) {
    document.body.setAttribute("data-test-status", "failed");
    document.getElementById("result").textContent = "失败：" + error.message;
  });
})();
