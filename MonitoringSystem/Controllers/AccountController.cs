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

        
        [HttpPost]
        public IActionResult Login(string username, string password, bool rememberMe)
        {
          
            if (username == "LGU" && password == "1234")
            {
                return RedirectToAction("Index", "LguDashboard");
            }

            
            if (username == "Driver" && password == "1234")
            {
                return RedirectToAction("Driver", "DriverDashboard");
            }

            
            if (username == "PNHS" && password == "1234")
            {
                return RedirectToAction("SchoolAdmin", "SchoolDashboard");
            }

            
            ViewBag.Error = "Invalid Username or Password";

            
            return View();
        }
    }
}
