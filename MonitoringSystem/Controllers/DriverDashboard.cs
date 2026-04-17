using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Controllers
{
    public class DriverDashboard : Controller
    {
        public IActionResult Driver()
        {
            return View();
        }
    }
}
