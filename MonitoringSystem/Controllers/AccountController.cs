using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class AccountController : Controller
    {
        // This shows the login page when you go to /Account/Login
        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        // This handles the SUBMIT button click
        [HttpPost]
        public IActionResult Login(string username, string password)
        {
            if (username == "LGU" && password == "1234")
            {
                // REDIRECTS to LguDashboard Controller -> Index Action
                return RedirectToAction("Index", "LguDashboard");
            }

            ViewBag.Error = "Invalid Username or Password";
            return View();
        }
    }
}
