using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Fido2NetLib;

namespace WebAuthnBackend;



public class Program
{
    const string corsPolicyName = "AllowLocal";

    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        builder.Services.AddMemoryCache();
        builder.Services.AddDistributedMemoryCache();
        builder.Services.AddControllers();
        builder.Services.AddCors(options =>
        {
            options.AddPolicy(corsPolicyName, builder =>
            {
                builder.WithOrigins("http://localhost:3000")
                    .WithExposedHeaders("Attestation-Options")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

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
            options.IdleTimeout = TimeSpan.FromMinutes(10);
            options.Cookie.HttpOnly = false;
            options.Cookie.IsEssential = true;
            // Strict SameSite mode is required because the default mode used
            // by ASP.NET Core 3 isn't understood by the Conformance Tool
            // and breaks conformance testing
            options.Cookie.SameSite = SameSiteMode.Unspecified;
        });

        var app = builder.Build();
        app.UseRouting();
        app.UseSession();
        app.UseCors(corsPolicyName);

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });
        app.MapGet("/", () => "👋 Hi!");
        app.Run();
    }
}
