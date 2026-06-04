using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using MonitoringSystem.Controllers;
using System.Linq;

namespace MonitoringSystem.Controllers
{
    public class AccountController : Controller
    {
        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(string username, string password, bool rememberMe)
        {
            string loggedInName = "";
            string loggedInRole = "";

            // 1. CHECK HARDCODED ACCOUNTS
            if (username == "LGU" && password == "1234")
            {
                loggedInName = "Admin Chief";
                loggedInRole = "lgu";
            }
            else if (username == "Driver" && password == "1234")
            {
                loggedInName = "Ricardo Dalisay";
                loggedInRole = "driver";
            }
            else if (username == "PNHS" && password == "1234")
            {
                loggedInName = "Patao High Admin";
                loggedInRole = "school";
            }
            else
            {
                // 2. CHECK DYNAMIC ACCOUNTS
                var userAccount = LguDashboardController._accountList
                    .FirstOrDefault(u => u.Username == username && u.Password == password);

                if (userAccount != null)
                {
                    loggedInName = userAccount.FullName;
                    loggedInRole = userAccount.Role;
                }
            }

            // 3. IF LOGIN IS SUCCESSFUL, RECORD THE ACTIVITY
            if (!string.IsNullOrEmpty(loggedInRole))
            {
                // ADD TO SHARED LOG LIST
                LguDashboardController._activityLogs.Add(new ActivityLog
                {
                    User = loggedInName,
                    Role = loggedInRole.ToUpper(),
                    Action = "Login Successful",
                    Timestamp = DateTime.Now.ToString("MMM dd, hh:mm tt")
                });

                // REDIRECT BASED ON ROLE
                if (loggedInRole == "lgu") return RedirectToAction("Index", "LguDashboard");
                if (loggedInRole == "school") return RedirectToAction("SchoolAdmin", "SchoolDashboard");
                if (loggedInRole == "driver") return RedirectToAction("Driver", "DriverDashboard");
            }

            // 4. If nothing matches
            ViewBag.Error = "Invalid Username or Password";
            return View();
        }
    }
}