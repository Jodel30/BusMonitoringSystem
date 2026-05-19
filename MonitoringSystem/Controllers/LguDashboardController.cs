using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;
using System.Linq; 

namespace MonitoringSystem.Controllers
{
    public class LguDashboardController : Controller
    {
        public IActionResult Index()
        {
            var viewModel = new LguDashboardViewModel
            {
                // Accessing the shared list correctly here:
                Students = SchoolDashboard._studentList,
                TripLogs = DriverDashboard._tripHistory
            };

            return View(viewModel);
        }

        [HttpPost]
        public IActionResult ResolveLowUsageAlert(string lrn)
        {
            
            var student = SchoolDashboard._studentList.FirstOrDefault(s => s.LRN.Trim() == lrn.Trim());

            if (student != null)
            {
                student.LowUsageAlertResolved = true;
                return Json(new { success = true });
            }
            return Json(new { success = false });
        }
    }
}