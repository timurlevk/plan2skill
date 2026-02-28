import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@plan2skill/ui', '@plan2skill/types', '@plan2skill/store', '@plan2skill/api-client'],
};

export default nextConfig;
