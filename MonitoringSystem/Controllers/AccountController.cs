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
            bool usernameFound = false;

            // 1. SEARCH FOR THE USERNAME FIRST (Hardcoded)
            if (username == "LGU" || username == "Driver" || username == "PNHS")
            {
                usernameFound = true;
                // Check the specific hardcoded password
                if (password == "1234")
                {
                    if (username == "LGU") user = new SystemAccount { FirstName = "Admin", LastName = "Chief", Role = "lgu", Username = "LGU" };
                    else if (username == "Driver") user = new SystemAccount { FirstName = "Ricardo", LastName = "Dalisay", Role = "driver", Username = "Driver" };
                    else user = new SystemAccount { FirstName = "Patao High", LastName = "Admin", Role = "school", Username = "PNHS" };
                }
            }
            else
            {
                // 2. SEARCH FOR THE USERNAME (Dynamic List)
                var account = LguDashboardController._accountList.FirstOrDefault(u => u.Username == username);
                if (account != null)
                {
                    usernameFound = true;
                    // Check if the password matches the account found
                    if (account.Password == password)
                    {
                        user = account;
                    }
                }
            }

            // 3. IF LOGIN IS SUCCESSFUL
            if (user != null)
            {
                CurrentUser = user;

                LguDashboardController._activityLogs.Add(new ActivityLog
                {
                    User = user.FullName,
                    Role = user.Role.ToUpper(),
                    Action = "Login Successful",
                    Timestamp = DateTime.Now.ToString("MMM dd, hh:mm tt")
                });

                if (user.Role == "lgu") return RedirectToAction("Index", "LguDashboard");
                if (user.Role == "school") return RedirectToAction("SchoolAdmin", "SchoolDashboard");
                if (user.Role == "driver") return RedirectToAction("Driver", "DriverDashboard");
            }

            // 4. PROFESSIONAL ERROR HANDLING
            if (!usernameFound)
            {
                ViewBag.Error = "The username entered does not match our records.";
            }
            else
            {
                // If we found the username but 'user' is still null, it means the password failed
                ViewBag.Error = "The password you entered is incorrect. Please try again.";
            }

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