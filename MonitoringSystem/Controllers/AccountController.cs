using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using MonitoringSystem.Controllers;
using System.Linq;

namespace MonitoringSystem.Controllers
{
    public class AccountController : Controller
    {
      
        public static SystemAccount CurrentUser { get; set; }

        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        public IActionResult Login(string username, string password, bool rememberMe)
        {
            SystemAccount user = null;

            // 1. CHECK HARDCODED ACCOUNTS
           
            if (username == "LGU" && password == "1234")
            {
                user = new SystemAccount { FirstName = "Admin", LastName = "Chief", Role = "lgu", Username = "LGU" };
            }
            else if (username == "Driver" && password == "1234")
            {
                user = new SystemAccount { FirstName = "Ricardo", LastName = "Dalisay", Role = "driver", Username = "Driver" };
            }
            else if (username == "PNHS" && password == "1234")
            {
                user = new SystemAccount { FirstName = "Patao High", LastName = "Admin", Role = "school", Username = "PNHS" };
            }
            else
            {
                // 2. CHECK DYNAMIC ACCOUNTS (The ones you created)
                user = LguDashboardController._accountList
                    .FirstOrDefault(u => u.Username == username && u.Password == password);
            }

            // 3. IF LOGIN IS SUCCESSFUL
            if (user != null)
            {
               
                CurrentUser = user;

                // RECORD THE ACTIVITY LOG
                LguDashboardController._activityLogs.Add(new ActivityLog
                {
                    User = user.FullName,
                    Role = user.Role.ToUpper(),
                    Action = "Login Successful",
                    Timestamp = DateTime.Now.ToString("MMM dd, hh:mm tt")
                });

                // REDIRECT BASED ON ROLE
                if (user.Role == "lgu") return RedirectToAction("Index", "LguDashboard");
                if (user.Role == "school") return RedirectToAction("SchoolAdmin", "SchoolDashboard");
                if (user.Role == "driver") return RedirectToAction("Driver", "DriverDashboard");
            }

            // 4. If nothing matches
            ViewBag.Error = "Invalid Username or Password";
            return View();
        }

        
        [HttpGet]
        public IActionResult GetMyProfile()
        {
            if (CurrentUser == null) return Json(new { success = false });

            return Json(new
            {
                success = true,
                name = CurrentUser.FullName,
                username = CurrentUser.Username,
                role = CurrentUser.Role.ToUpper(),
                address = CurrentUser.Address ?? "LGU Office",
                contact = CurrentUser.ContactNo ?? "N/A",
                email = CurrentUser.Email ?? "system@stms.gov.ph"
            });
        }
    }
}