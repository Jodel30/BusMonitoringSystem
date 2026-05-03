using Microsoft.AspNetCore.Mvc;
using MonitoringSystem.Models;

namespace MonitoringSystem.Controllers
{
    public class LguDashboardController : Controller
    {
        public IActionResult Index()
        {
            // Create the container and pull data from the two other controllers
            var viewModel = new LguDashboardViewModel
            {
                // Pulls the student list from SchoolDashboard
                Students = SchoolDashboard._studentList,

                // Pulls the trip logs from DriverDashboard
                TripLogs = DriverDashboard._tripHistory
            };

            return View(viewModel);
        }
    }
}
