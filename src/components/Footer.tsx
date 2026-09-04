import { Plane, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "Preise", href: "#pricing" },
      { name: "Community", href: "#community" },
      { name: "Events", href: "#events" },
    ],
    legal: [
      { name: "Impressum", href: "/impressum" },
      { name: "Datenschutz", href: "/datenschutz" },
      { name: "AGB", href: "/agb" },
      { name: "Community-Richtlinien", href: "/community-richtlinien" },
    ],
    support: [
      { name: "Hilfe & FAQ", href: "/hilfe" },
      { name: "Kontakt", href: "/kontakt" },
      { name: "Feedback", href: "/feedback" },
    ],
  };

  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">
                Sky<span className="text-secondary">Buddy</span>
              </span>
            </a>
            <p className="text-white/60 mb-6 max-w-sm leading-relaxed">
              Die Community für Privatpiloten in Europa. 
              Fly together. Share the sky. ✈️
            </p>
            <div className="flex flex-col gap-3 text-white/60 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@ld-solutions.de</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Europa-weit</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Produkt</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Rechtliches</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm">
            © 2026 SkyBuddy. Alle Rechte vorbehalten.
          </p>
          <p className="text-white/40 text-sm">
            Made with ❤️ für die Allgemeine Luftfahrt
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
