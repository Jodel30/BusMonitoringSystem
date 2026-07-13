using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using MonitoringSystem.Data;
using System.Linq;
using System;

namespace MonitoringSystem.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _context;

        public AccountController(ApplicationDbContext context)
        {
            _context = context;
        }

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

            // 1. CHECK HARDCODED ACCOUNTS (For demo convenience)
            if (username == "LGU" || username == "Driver" || username == "PNHS")
            {
                usernameFound = true;
                if (password == "1234")
                {
                    // Note: Hardcoded users use negative IDs so they don't conflict with Database IDs
                    if (username == "LGU") user = new SystemAccount { UserID = -1, FirstName = "Admin", LastName = "Chief", Role = "lgu", Username = "LGU" };
                    else if (username == "Driver") user = new SystemAccount { UserID = -2, FirstName = "Ricardo", LastName = "Dalisay", Role = "driver", Username = "Driver" };
                    else user = new SystemAccount { UserID = -3, FirstName = "Patao High", LastName = "Admin", Role = "school", Username = "PNHS" };
                }
            }
            else
            {
                // 2. CHECK DYNAMIC ACCOUNTS FROM THE NEW 'Users' TABLE
                var dbAccount = _context.Users.FirstOrDefault(u => u.Username == username);
                if (dbAccount != null)
                {
                    usernameFound = true;
                    if (dbAccount.Password == password)
                    {
                        user = dbAccount;
                    }
                }
            }

            // 3. IF LOGIN IS SUCCESSFUL
            if (user != null)
            {
                CurrentUser = user;

                // SAVE LOGIN LOG TO SQL SERVER MATCHING THE NEW ERD
                // The ERD requires UserID (int), LogDate (date), and LogTime (time)
                _context.ActivityLogs.Add(new ActivityLog
                {
                    UserID = user.UserID,
                    User = user.FullName, // Keep for easy display
                    Role = user.Role.ToUpper(),
                    Action = "Login Successful",
                    LogDate = DateTime.Today,
                    LogTime = DateTime.Now.TimeOfDay
                });

                _context.SaveChanges();

                if (user.Role == "lgu") return RedirectToAction("Index", "LguDashboard");
                if (user.Role == "school") return RedirectToAction("SchoolAdmin", "SchoolDashboard");
                if (user.Role == "driver") return RedirectToAction("Driver", "DriverDashboard");
            }

            // 4. ERROR HANDLING
            if (!usernameFound)
            {
                ViewBag.Error = "The username entered does not match our records.";
            }
            else
            {
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
                // Updated property names to match the new ERD User table
                contact = CurrentUser.ContactNum ?? "N/A",
                // Note: If your ERD 'User' table doesn't have Address/Email, 
                // these will come back as N/A or you can add them to the model.
                address = "Registered Office",
                email = "system@stms.gov.ph"
            });
        }
    }
}