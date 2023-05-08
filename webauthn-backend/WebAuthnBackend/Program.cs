using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Fido2NetLib;

namespace WebAuthnBackend;

public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build();

        var builder = WebApplication.CreateBuilder(args);
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddDistributedMemoryCache();
        builder.Services.AddControllers();
        builder.Services.AddCors();

        // Set up Fido2 in dependency injection container
        var config = new Fido2Configuration()
        {
            ServerDomain = "localhost",
            ServerName = "WebAuthnBackend",
            Origin = "https://localhost:44329"
        };
        builder.Services.AddSingleton<IFido2>(new Fido2(config));
        builder.Services.AddSession(options =>
        {
            // Set a short timeout for easy testing.
            options.IdleTimeout = TimeSpan.FromMinutes(2);
            options.Cookie.HttpOnly = true;
            options.Cookie.IsEssential = true;
            // Strict SameSite mode is required because the default mode used
            // by ASP.NET Core 3 isn't understood by the Conformance Tool
            // and breaks conformance testing
            options.Cookie.SameSite = SameSiteMode.Unspecified;
        });

        var app = builder.Build();
        app.UseCors((corsBuilder) =>
        {
            corsBuilder.AllowAnyHeader();
            corsBuilder.AllowAnyMethod();
            corsBuilder.AllowAnyOrigin();
            corsBuilder.Build();
        });

        app.UseRouting();
        app.UseSession();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
        app.MapGet("/", () => "👋 Hi!");
        app.Run();
    }

    public static IHostBuilder CreateHostBuilder(string[] args)
    {
        return Host.CreateDefaultBuilder(args)
                   .ConfigureWebHostDefaults(webBuilder =>
                   {
                       webBuilder.UseStartup<Startup>();
                   });
    }
}
