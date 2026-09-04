import { Link } from "react-router-dom";

const DashboardFooter = () => {
  const legalLinks = [
    { name: "Impressum", href: "/impressum" },
    { name: "Datenschutz", href: "/datenschutz" },
    { name: "AGB", href: "/agb" },
    { name: "Community-Richtlinien", href: "/community-richtlinien" },
  ];

  const supportLinks = [
    { name: "Hilfe & FAQ", href: "/hilfe" },
    { name: "Kontakt", href: "/kontakt" },
    { name: "Feedback", href: "/feedback" },
  ];

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          {/* Rechtliches */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">Rechtliches</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {legalLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">Support</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/50 mt-6 pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 SkyBuddy. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default DashboardFooter;
