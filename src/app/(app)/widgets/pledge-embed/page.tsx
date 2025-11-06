export default function PledgeEmbedDemo() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pledge Widget Embed Demo</h1>
      <p className="mb-8 text-gray-600">
        This page loads the embed widget version (built with Web Components)
      </p>
      
      {/* Load the widget script */}
      <script
        type="module"
        dangerouslySetInnerHTML={{
          __html: `
            import { init } from "/embed-sdk/nw-embed.es.js";
            
            init({
              tokenProvider: {
                get: async () => {
                  const res = await fetch("/api/embed/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tid: "northwoods-dev",
                      wid: "pledge",
                      initToken: "northwoods-dev_dev-secret"
                    })
                  });
                  return (await res.json()).token;
                },
                refresh: async () => {
                  const res = await fetch("/api/embed/session", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      tid: "northwoods-dev",
                      wid: "pledge",
                      initToken: "northwoods-dev_dev-secret"
                    })
                  });
                  return (await res.json()).token;
                }
              }
            });
          `
        }}
      />
      
      {/* The widget */}
      <nw-pledge campaign-id="115" />
    </div>
  );
}
