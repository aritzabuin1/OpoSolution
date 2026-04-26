import { clusterDistribution, getClusterPosts } from '../lib/seo/blog-clusters'
const dist = clusterDistribution()
console.log('Cluster distribution:')
for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(24)} ${v}`)
}
console.log('\nTransversal posts:')
for (const p of getClusterPosts('transversal')) {
  console.log(`  - ${p.slug}`)
}
