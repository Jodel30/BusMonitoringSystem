using Microsoft.EntityFrameworkCore;
using MonitoringSystem.Models; // Ensure this matches your project name

namespace MonitoringSystem.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // These tell SQL Server to create tables for your models
        public DbSet<SystemAccount> Users { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<QRCode> QRCodes { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<Trip> Trips { get; set; }
        public DbSet<TransportActivity> TransportActivities { get; set; }
        public DbSet<Notification> Notifications { get; set; }
    }
}
