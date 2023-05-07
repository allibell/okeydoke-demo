using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

namespace WebAuthnBackend;

public class Program
{
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build();

        var builder = WebApplication.CreateBuilder(args);
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddCors();
        var app = builder.Build();
        app.UseCors((corsBuilder) =>
        {
            corsBuilder.AllowAnyHeader();
            corsBuilder.AllowAnyMethod();
            corsBuilder.AllowAnyOrigin();
            corsBuilder.Build();
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
