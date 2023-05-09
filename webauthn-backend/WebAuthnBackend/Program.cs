using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Fido2NetLib;

namespace WebAuthnBackend;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.Services.AddMemoryCache();
        builder.Services.AddDistributedMemoryCache();
        builder.Services.AddControllers();
        builder.Services.AddCors();

        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.json")
            .Build();
        var fidoConfig = config.GetSection("fido2").Get<Fido2Configuration>();
        builder.Services.AddFido2(options =>
        {
            options.ServerDomain = fidoConfig.ServerDomain;
            options.ServerName = fidoConfig.ServerName;
            options.Origins = fidoConfig.Origins;
            options.TimestampDriftTolerance = fidoConfig.TimestampDriftTolerance;
            options.MDSCacheDirPath = fidoConfig.MDSCacheDirPath;
        })
        .AddCachedMetadataService(config =>
        {
            config.AddFidoMetadataRepository(httpClientBuilder =>
            {
                //TODO: any specific config you want for accessing the MDS
            });
        });

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
        app.UseSession();
        app.UseStaticFiles();
        app.UseRouting();
        app.UseCors((corsBuilder) =>
        {
            corsBuilder.AllowAnyHeader();
            corsBuilder.AllowAnyMethod();
            corsBuilder.AllowAnyOrigin();
            corsBuilder.Build();
        });

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
        app.MapGet("/", () => "👋 Hi!");
        app.Run();
    }
}
