import { NextResponse } from "next/server";
import siteRegistry from "./data/sites.json";

const domainSites = (siteRegistry.sites || [])
  .filter((site) => site.active === true && site.profile?.customDomain)
  .map((site) => ({
    slug: site.slug,
    domain: site.profile.customDomain.toLowerCase(),
  }));

export function middleware(request) {
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const site = domainSites.find((candidate) => candidate.domain === hostname);
  if (!site) return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const sitePrefix = `/sites/${site.slug}`;
  if (pathname === sitePrefix || pathname.startsWith(`${sitePrefix}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(sitePrefix.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  if (
    pathname.startsWith("/_next/")
    || pathname.startsWith("/api/")
    || pathname === "/admin"
    || pathname.startsWith("/admin/")
    || pathname === "/favicon.ico"
    || pathname === "/icon.svg"
    || pathname.startsWith("/images/")
    || pathname.startsWith("/og/")
    || pathname === "/ads.txt"
  ) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `${sitePrefix}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
