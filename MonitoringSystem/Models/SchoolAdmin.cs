using Microsoft.AspNetCore.Mvc;

namespace MonitoringSystem.Models
{
    public class SchoolAdmin : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
