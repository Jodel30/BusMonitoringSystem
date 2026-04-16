using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class AccountController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(string username, string password)
        {
            if (username == "admin" && password == "1234")
            {
                return RedirectToAction("Index", "LguDashboard");
            }

            ViewBag.Error = "Invalid login";
            return View();
        }
    }
}
