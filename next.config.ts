import type { NextConfig } from "next";

const url = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*",
            },
            {
                protocol: "http",
                hostname: "*",
            }
        ],
        localPatterns: [
            {
                pathname: "/bucket/**"
            },
            {
                pathname: "/badges/**"
            }
        ]
    },
};
export default nextConfig;