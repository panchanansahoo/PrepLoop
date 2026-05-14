// System Design Simulator — 12 Design Problems
// Each problem includes requirements, hints, expected components, and scale estimations

export const SD_COMPONENT_CATEGORIES = [
    {
        id: 'clients',
        label: 'Clients',
        color: '#60a5fa',
        components: [
            { id: 'web-client', label: 'Web Client', icon: '🌐', desc: 'Browser-based frontend' },
            { id: 'mobile-client', label: 'Mobile App', icon: '📱', desc: 'iOS/Android application' },
            { id: 'iot-device', label: 'IoT Device', icon: '📡', desc: 'Sensors & smart devices' },
        ]
    },
    {
        id: 'networking',
        label: 'Networking',
        color: '#22d3ee',
        components: [
            { id: 'load-balancer', label: 'Load Balancer', icon: '⚖️', desc: 'Distributes traffic across servers' },
            { id: 'api-gateway', label: 'API Gateway', icon: '🚪', desc: 'Single entry point, routing & auth' },
            { id: 'cdn', label: 'CDN', icon: '🌍', desc: 'Content delivery network' },
            { id: 'dns', label: 'DNS', icon: '🔗', desc: 'Domain name resolution' },
            { id: 'reverse-proxy', label: 'Reverse Proxy', icon: '🔄', desc: 'Request forwarding & SSL termination' },
        ]
    },
    {
        id: 'compute',
        label: 'Compute',
        color: '#a78bfa',
        components: [
            { id: 'app-server', label: 'App Server', icon: '🖥️', desc: 'Application logic processing' },
            { id: 'worker', label: 'Worker', icon: '⚙️', desc: 'Background job processor' },
            { id: 'serverless', label: 'Serverless Fn', icon: '⚡', desc: 'Event-driven compute (Lambda)' },
            { id: 'scheduler', label: 'Scheduler', icon: '⏰', desc: 'Cron jobs & task scheduling' },
        ]
    },
    {
        id: 'storage',
        label: 'Storage',
        color: '#34d399',
        components: [
            { id: 'sql-db', label: 'SQL Database', icon: '🗄️', desc: 'PostgreSQL, MySQL — relational data' },
            { id: 'nosql-db', label: 'NoSQL Database', icon: '📦', desc: 'MongoDB, DynamoDB — flexible schema' },
            { id: 'object-storage', label: 'Object Storage', icon: '☁️', desc: 'S3 — files, images, videos' },
            { id: 'data-warehouse', label: 'Data Warehouse', icon: '🏗️', desc: 'BigQuery — analytics queries' },
            { id: 'graph-db', label: 'Graph Database', icon: '🕸️', desc: 'Neo4j — relationship-heavy data' },
            { id: 'time-series-db', label: 'Time-Series DB', icon: '📈', desc: 'InfluxDB — metrics & events' },
            { id: 'thumbnail-storage', label: 'Thumbnail Storage', icon: '🖼️', desc: 'Dedicated thumbnail image storage' },
        ]
    },
    {
        id: 'caching',
        label: 'Caching',
        color: '#fb923c',
        components: [
            { id: 'redis-cache', label: 'Redis Cache', icon: '💾', desc: 'In-memory key-value cache' },
            { id: 'memcached', label: 'Memcached', icon: '🗃️', desc: 'Distributed memory cache' },
            { id: 'cdn-cache', label: 'CDN Cache', icon: '🌐', desc: 'Edge caching for static assets' },
            { id: 'media-cache', label: 'Media Cache', icon: '🎞️', desc: 'Server-side media content cache' },
        ]
    },
    {
        id: 'messaging',
        label: 'Messaging',
        color: '#f472b6',
        components: [
            { id: 'message-queue', label: 'Message Queue', icon: '📬', desc: 'RabbitMQ, SQS — async tasks' },
            { id: 'kafka', label: 'Event Stream', icon: '🔥', desc: 'Kafka — event streaming' },
            { id: 'pub-sub', label: 'Pub/Sub', icon: '📢', desc: 'Topic-based fan-out messaging' },
            { id: 'websocket-server', label: 'WebSocket Server', icon: '🔌', desc: 'Real-time bidirectional comms' },
        ]
    },
    {
        id: 'services',
        label: 'Services',
        color: '#fbbf24',
        components: [
            { id: 'auth-service', label: 'Auth Service', icon: '🔐', desc: 'Authentication & authorization' },
            { id: 'search-service', label: 'Search Service', icon: '🔍', desc: 'Elasticsearch — full-text search' },
            { id: 'notification-service', label: 'Notification', icon: '🔔', desc: 'Push, email, SMS notifications' },
            { id: 'payment-service', label: 'Payment Service', icon: '💳', desc: 'Stripe/PayPal processing' },
            { id: 'ml-service', label: 'ML Service', icon: '🤖', desc: 'ML model inference' },
            { id: 'encoding-service', label: 'Encoding Service', icon: '🎬', desc: 'Video/audio transcoding' },
            { id: 'location-service', label: 'Location Service', icon: '📍', desc: 'Geospatial & GPS tracking' },
            { id: 'rate-limiter', label: 'Rate Limiter', icon: '🚦', desc: 'Request throttling' },
        ]
    },
    {
        id: 'monitoring',
        label: 'Monitoring',
        color: '#8b5cf6',
        components: [
            { id: 'logging', label: 'Log Aggregator', icon: '📋', desc: 'ELK stack — centralized logs' },
            { id: 'metrics', label: 'Metrics Service', icon: '📊', desc: 'Prometheus/Grafana — monitoring' },
            { id: 'tracing', label: 'Distributed Tracing', icon: '🔬', desc: 'Jaeger — request traces' },
        ]
    },
    {
        id: 'netflix',
        label: 'Netflix OSS',
        color: '#e50914',
        components: [
            { id: 'elb', label: 'ELB', icon: '⚖️', desc: 'Elastic Load Balancer — AWS load balancing' },
            { id: 'netty-server', label: 'Netty Server', icon: '🌐', desc: 'Non-blocking I/O server' },
            { id: 'zuul-gateway', label: 'Zuul Gateway', icon: '🚪', desc: 'Netflix edge gateway — routing & filtering' },
            { id: 'hystrix', label: 'Hystrix', icon: '🛡️', desc: 'Circuit breaker & fault tolerance' },
            { id: 'ev-cache', label: 'EV Cache', icon: '💾', desc: 'Netflix distributed caching layer' },
            { id: 'cassandra-db', label: 'Cassandra', icon: '🗄️', desc: 'Distributed NoSQL database' },
            { id: 'open-connect', label: 'Open Connect', icon: '☁️', desc: 'Netflix CDN — content delivery' },
            { id: 'chukwa', label: 'Chukwa', icon: '📡', desc: 'Data collection system for monitoring' },
            { id: 'emr-hadoop', label: 'EMR/Hadoop', icon: '🏗️', desc: 'Amazon EMR — managed Hadoop framework' },
            { id: 'spark-engine', label: 'Spark', icon: '⚡', desc: 'Distributed data processing engine' },
            { id: 'elasticsearch', label: 'Elastic Search', icon: '🔍', desc: 'Search & analytics engine' },
            { id: 'chaos-monkey', label: 'Chaos Monkey', icon: '🐒', desc: 'Chaos engineering — resilience testing' },
            { id: 'titus', label: 'Titus', icon: '📦', desc: 'Netflix container management platform' },
            { id: 'video-transcoder', label: 'Transcoder', icon: '🎬', desc: 'Video encoding & transcoding service' },
            { id: 'mysql-billing', label: 'MySQL Billing', icon: '💳', desc: 'MySQL — billing & account data' },
            { id: 's3-storage', label: 'S3 Storage', icon: '☁️', desc: 'Amazon S3 — object storage' },
            { id: 'apache-samza', label: 'Apache Samza', icon: '🔄', desc: 'Stream processing framework' },
            { id: 'microservice-node', label: 'Micro Service', icon: '🖥️', desc: 'Independent microservice unit' },
            { id: 'critical-microservice', label: 'Critical Micro Service', icon: '🔴', desc: 'High-priority critical microservice' },
            { id: 'service-client', label: 'Service Client', icon: '📞', desc: 'Inter-service communication client' },
        ]
    },
    {
        id: 'telegram',
        label: 'Telegram',
        color: '#0088cc',
        components: [
            { id: 'chat-service', label: 'Chat Service', icon: '💬', desc: 'Real-time messaging & chat routing' },
            { id: 'user-profile-svc', label: 'User Profile Service', icon: '👤', desc: 'User profile management' },
            { id: 'group-service', label: 'Group Service', icon: '👥', desc: 'Group chat management & membership' },
            { id: 'session-service', label: 'Session Service', icon: '🔑', desc: 'Session management & multi-device sync' },
            { id: 'last-seen-svc', label: 'Last Seen Service', icon: '👁️', desc: 'Online status & last seen tracking' },
            { id: 'relay-service', label: 'Relay Service', icon: '🔀', desc: 'Message relay & routing between DCs' },
            { id: 'unread-messages', label: 'Unread Messages', icon: '📩', desc: 'Unread message counter & tracking' },
            { id: 'asset-service', label: 'Asset Service', icon: '📎', desc: 'Media & file asset management' },
            { id: 'auth-gateway', label: 'Auth Gateway', icon: '🔐', desc: 'Authentication & encryption gateway' },
            { id: 'group-db', label: 'GroupDB', icon: '🗄️', desc: 'Group metadata database' },
            { id: 'session-db', label: 'Session DB', icon: '🗄️', desc: 'Session information store' },
            { id: 'status-db', label: 'StatusDB', icon: '🗄️', desc: 'User online status database' },
            { id: 'storage-replica', label: 'Storage Replica', icon: '💾', desc: 'Replicated media storage node' },
        ]
    },
    {
        id: 'twitter',
        label: 'Twitter',
        color: '#1da1f2',
        components: [
            { id: 'tweets-writer', label: 'Tweets Writer', icon: '✍️', desc: 'Handles tweet creation & persistence' },
            { id: 'timeline-service', label: 'Timeline Service', icon: '📜', desc: 'Home & user timeline retrieval' },
            { id: 'fanout-service', label: 'Fanout (Async)', icon: '📡', desc: 'Async fan-out to follower timelines' },
            { id: 'earlybird', label: 'Earlybird (Lucene)', icon: '🐦', desc: 'Real-time search based on Lucene' },
            { id: 'storm-heron', label: 'Storm/Heron', icon: '🌪️', desc: 'Stream processing for trends data' },
            { id: 'zookeeper', label: 'Zookeeper', icon: '🐘', desc: 'Cluster coordination & management' },
            { id: 'redis-cluster', label: 'Redis Cluster', icon: '🔴', desc: 'Distributed Redis cache cluster' },
        ]
    }
];

// Flatten for easy lookup
export const ALL_COMPONENTS = SD_COMPONENT_CATEGORIES.flatMap(cat =>
    cat.components.map(c => ({ ...c, category: cat.id, categoryColor: cat.color }))
);

export const SD_PROBLEMS = [
    {
        id: 'design-twitter',
        title: 'Design Twitter',
        difficulty: 'Hard',
        icon: '🐦',
        estimatedTime: '45 min',
        description: 'Design a social media platform where users can post tweets, follow others, and view a personalized timeline feed.',
        requirements: {
            functional: [
                'Users can post tweets (280 chars, images/videos)',
                'Users can follow/unfollow other users',
                'Home timeline shows tweets from followed users',
                'Users can like, retweet, and reply',
                'Search tweets by keyword or hashtag',
            ],
            nonFunctional: [
                '500M total users, 200M DAU',
                'Timeline load < 200ms',
                '100M tweets posted per day',
                'High availability (99.99%)',
                'Eventually consistent timeline',
            ]
        },
        hints: [
            'Start with clients → load balancer → app servers → database',
            'Consider fan-out on write vs fan-out on read for timeline',
            'Use a cache layer (Redis) for hot timelines',
            'CDN for media (images, videos)',
            'Message queue for async operations (notifications, fan-out)',
            'Search service (Elasticsearch) for tweet search',
        ],
        expectedComponents: ['web-client', 'mobile-client', 'load-balancer', 'api-gateway', 'app-server', 'sql-db', 'nosql-db', 'redis-cache', 'cdn', 'message-queue', 'search-service', 'notification-service', 'object-storage'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'tw-web', componentId: 'web-client', label: 'Web Client', icon: '🌐', color: '#60a5fa', x: 40, y: 340 },
                { id: 'tw-mobile', componentId: 'mobile-client', label: 'Mobile Client', icon: '📱', color: '#60a5fa', x: 40, y: 460 },
                // Networking
                { id: 'tw-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 220, y: 400 },
                // Core Write Path
                { id: 'tw-writer', componentId: 'tweets-writer', label: 'Tweets Writer', icon: '✍️', color: '#1da1f2', x: 420, y: 240 },
                { id: 'tw-db', componentId: 'sql-db', label: 'Database', icon: '🗄️', color: '#34d399', x: 420, y: 60 },
                // Fanout & Cache
                { id: 'tw-fanout', componentId: 'fanout-service', label: 'FANOUT (Async)', icon: '📡', color: '#1da1f2', x: 640, y: 240 },
                { id: 'tw-redis', componentId: 'redis-cluster', label: 'Redis Cluster', icon: '🔴', color: '#1da1f2', x: 860, y: 300 },
                // Trends Processing
                { id: 'tw-storm', componentId: 'storm-heron', label: 'Apache Storm/Heron', icon: '🌪️', color: '#1da1f2', x: 600, y: 60 },
                // Timeline Read Path
                { id: 'tw-timeline', componentId: 'timeline-service', label: 'Timeline Service', icon: '📜', color: '#1da1f2', x: 420, y: 420 },
                // Search
                { id: 'tw-search', componentId: 'search-service', label: 'Search Service', icon: '🔍', color: '#fbbf24', x: 640, y: 460 },
                { id: 'tw-earlybird', componentId: 'earlybird', label: 'Earlybird (Lucene)', icon: '🐦', color: '#1da1f2', x: 860, y: 460 },
                // Real-time Connection
                { id: 'tw-ws', componentId: 'websocket-server', label: 'HTTP PUSH / WebSocket', icon: '🔌', color: '#f472b6', x: 280, y: 560 },
                // Zookeeper
                { id: 'tw-zk', componentId: 'zookeeper', label: 'Zookeeper', icon: '🐘', color: '#1da1f2', x: 860, y: 140 },
            ],
            connections: [
                // Clients → Load Balancer
                { from: 'tw-web', to: 'tw-lb' },
                { from: 'tw-mobile', to: 'tw-lb' },
                // Load Balancer → Services
                { from: 'tw-lb', to: 'tw-writer', label: 'tweet write' },
                { from: 'tw-lb', to: 'tw-timeline', label: 'Home/User Timeline' },
                { from: 'tw-lb', to: 'tw-ws', label: 'persistent' },
                // Write Path
                { from: 'tw-writer', to: 'tw-db' },
                { from: 'tw-writer', to: 'tw-fanout' },
                // Fanout → Redis
                { from: 'tw-fanout', to: 'tw-redis', label: 'Update cache' },
                // Trends Data
                { from: 'tw-writer', to: 'tw-storm', label: 'Trends data' },
                // Timeline reads from Redis
                { from: 'tw-timeline', to: 'tw-redis' },
                // Search path
                { from: 'tw-timeline', to: 'tw-search' },
                { from: 'tw-search', to: 'tw-earlybird' },
                // WebSocket → Timeline
                { from: 'tw-ws', to: 'tw-timeline' },
                // Zookeeper maintains Redis
                { from: 'tw-zk', to: 'tw-redis', label: 'Maintain cluster' },
            ]
        },
    },
    {
        id: 'design-url-shortener',
        title: 'Design URL Shortener',
        difficulty: 'Medium',
        icon: '🔗',
        estimatedTime: '30 min',
        description: 'Design a URL shortening service like bit.ly that converts long URLs to short ones and handles redirections.',
        requirements: {
            functional: [
                'Given a long URL, generate a short unique URL',
                'Redirect short URL to original long URL',
                'Custom short URL alias (optional)',
                'URL expiration / TTL support',
                'Analytics: click counts, geo, referrer',
            ],
            nonFunctional: [
                '100M URLs shortened per month',
                '1B redirects per month (10:1 read:write)',
                'Redirect latency < 50ms',
                'High availability for redirects',
                '99.9% uptime',
            ]
        },
        hints: [
            'Base62 encoding for short URL generation',
            'Cache frequently accessed URLs in Redis',
            'NoSQL or SQL for URL mapping storage',
            'Analytics can be async via message queue',
            'CDN or DNS-level redirection for speed',
        ],
        expectedComponents: ['web-client', 'load-balancer', 'app-server', 'sql-db', 'redis-cache', 'cdn'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'url-web', componentId: 'web-client', label: 'Web Client', icon: '🌐', color: '#60a5fa', x: 60, y: 260 },
                // Networking
                { id: 'url-dns', componentId: 'dns', label: 'DNS', icon: '🔗', color: '#22d3ee', x: 60, y: 100 },
                { id: 'url-cdn', componentId: 'cdn', label: 'CDN Edge', icon: '🌍', color: '#22d3ee', x: 260, y: 100 },
                { id: 'url-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 260, y: 260 },
                // Compute
                { id: 'url-write', componentId: 'app-server', label: 'Write Server', icon: '🖥️', color: '#a78bfa', x: 460, y: 180 },
                { id: 'url-read', componentId: 'app-server', label: 'Read Server', icon: '🖥️', color: '#a78bfa', x: 460, y: 340 },
                // Caching
                { id: 'url-cache', componentId: 'redis-cache', label: 'Redis Cache', icon: '💾', color: '#fb923c', x: 660, y: 260 },
                // Storage
                { id: 'url-db', componentId: 'sql-db', label: 'URL Database', icon: '🗄️', color: '#34d399', x: 660, y: 100 },
                // Analytics
                { id: 'url-queue', componentId: 'message-queue', label: 'Analytics Queue', icon: '📬', color: '#f472b6', x: 660, y: 420 },
                { id: 'url-analytics', componentId: 'nosql-db', label: 'Analytics DB', icon: '📦', color: '#34d399', x: 860, y: 420 },
                // Rate Limiter
                { id: 'url-ratelimit', componentId: 'rate-limiter', label: 'Rate Limiter', icon: '🚦', color: '#fbbf24', x: 260, y: 420 },
            ],
            connections: [
                // Client → DNS → CDN
                { from: 'url-web', to: 'url-dns', label: 'Resolve' },
                { from: 'url-dns', to: 'url-cdn' },
                // Client → LB
                { from: 'url-web', to: 'url-lb' },
                // LB → Servers
                { from: 'url-lb', to: 'url-write', label: 'Shorten' },
                { from: 'url-lb', to: 'url-read', label: 'Redirect' },
                // Rate limiter
                { from: 'url-lb', to: 'url-ratelimit' },
                // Write path
                { from: 'url-write', to: 'url-db', label: 'Store mapping' },
                { from: 'url-write', to: 'url-cache', label: 'Populate cache' },
                // Read path
                { from: 'url-read', to: 'url-cache', label: 'Lookup cache' },
                { from: 'url-cache', to: 'url-db', label: 'Cache miss' },
                // Analytics
                { from: 'url-read', to: 'url-queue', label: 'Log click' },
                { from: 'url-queue', to: 'url-analytics' },
            ]
        },
    },
    {
        id: 'design-netflix',
        title: 'Design Netflix',
        difficulty: 'Hard',
        icon: '🎬',
        estimatedTime: '45 min',
        description: 'Design a video streaming platform with content upload, transcoding, adaptive streaming, and personalized recommendations.',
        requirements: {
            functional: [
                'Upload and store video content',
                'Transcode videos into multiple resolutions',
                'Stream with adaptive bitrate (ABR)',
                'Personalized content recommendations',
                'User profiles, watchlist, continue watching',
            ],
            nonFunctional: [
                '200M subscribers globally',
                '10M concurrent streams',
                'Playback start < 3 seconds',
                'Multi-region availability',
                '99.99% uptime for streaming',
            ]
        },
        hints: [
            'Object storage (S3) for raw & transcoded video files',
            'CDN is critical — cache content at edge for low latency',
            'Encoding service for video transcoding pipeline',
            'Message queue to orchestrate the encoding pipeline',
            'ML service for recommendation engine',
            'NoSQL for user activity & watch history',
        ],
        expectedComponents: ['web-client', 'mobile-client', 'cdn', 'load-balancer', 'api-gateway', 'app-server', 'object-storage', 'encoding-service', 'message-queue', 'sql-db', 'nosql-db', 'redis-cache', 'ml-service'],
        referenceArchitecture: {
            nodes: [
                { id: 'ref-clients', componentId: 'web-client', label: 'Clients', icon: '🌐', color: '#60a5fa', x: 40, y: 220 },
                { id: 'ref-open-connect', componentId: 'open-connect', label: 'Open Connect CDN', icon: '☁️', color: '#e50914', x: 160, y: 320 },
                { id: 'ref-elb', componentId: 'elb', label: 'ELB', icon: '⚖️', color: '#e50914', x: 200, y: 210 },
                { id: 'ref-netty', componentId: 'netty-server', label: 'Netty Server', icon: '🌐', color: '#e50914', x: 330, y: 210 },
                { id: 'ref-zuul', componentId: 'zuul-gateway', label: 'Zuul Gateway', icon: '🚪', color: '#e50914', x: 460, y: 280 },
                { id: 'ref-outbound', componentId: 'zuul-gateway', label: 'Outbound Filter', icon: '🔄', color: '#22d3ee', x: 420, y: 140 },
                { id: 'ref-inbound', componentId: 'zuul-gateway', label: 'Inbound Filter', icon: '🔄', color: '#22d3ee', x: 420, y: 340 },
                { id: 'ref-endpoint', componentId: 'zuul-gateway', label: 'Endpoint Filter', icon: '🔄', color: '#22d3ee', x: 460, y: 210 },
                { id: 'ref-hystrix', componentId: 'hystrix', label: 'Hystrix', icon: '🛡️', color: '#e50914', x: 600, y: 210 },
                { id: 'ref-ev-cache', componentId: 'ev-cache', label: 'EV Cache', icon: '💾', color: '#e50914', x: 660, y: 130 },
                { id: 'ref-microservices', componentId: 'microservice-node', label: 'Micro Services', icon: '🖥️', color: '#fbbf24', x: 700, y: 210 },
                { id: 'ref-critical-ms', componentId: 'critical-microservice', label: 'Critical Micro Services', icon: '🔴', color: '#e50914', x: 830, y: 170 },
                { id: 'ref-service-client', componentId: 'service-client', label: 'Service Client', icon: '📞', color: '#fbbf24', x: 720, y: 300 },
                { id: 'ref-ms2', componentId: 'microservice-node', label: 'Micro Services', icon: '🖥️', color: '#fbbf24', x: 850, y: 300 },
                { id: 'ref-cassandra', componentId: 'cassandra-db', label: 'Cassandra', icon: '🗄️', color: '#e50914', x: 720, y: 60 },
                { id: 'ref-mysql', componentId: 'mysql-billing', label: 'MySQL Billing', icon: '💳', color: '#e50914', x: 900, y: 60 },
                { id: 'ref-chaos', componentId: 'chaos-monkey', label: 'Chaos Monkey', icon: '🐒', color: '#e50914', x: 480, y: 60 },
                { id: 'ref-titus', componentId: 'titus', label: 'Titus', icon: '📦', color: '#e50914', x: 580, y: 60 },
                { id: 'ref-new-video', componentId: 'message-queue', label: 'New Video Queue', icon: '📬', color: '#f472b6', x: 460, y: 420 },
                { id: 'ref-chukwa', componentId: 'chukwa', label: 'Chukwa', icon: '📡', color: '#e50914', x: 620, y: 420 },
                { id: 'ref-s3', componentId: 's3-storage', label: 'S3 Storage', icon: '☁️', color: '#e50914', x: 740, y: 420 },
                { id: 'ref-emr', componentId: 'emr-hadoop', label: 'EMR/Hadoop', icon: '🏗️', color: '#e50914', x: 870, y: 420 },
                { id: 'ref-transcoder', componentId: 'video-transcoder', label: 'Transcoder', icon: '🎬', color: '#e50914', x: 200, y: 480 },
                { id: 'ref-workers', componentId: 'worker', label: 'Async Workers', icon: '⚙️', color: '#a78bfa', x: 340, y: 480 },
                { id: 'ref-kafka1', componentId: 'kafka', label: 'Kafka Router', icon: '🔥', color: '#f472b6', x: 530, y: 520 },
                { id: 'ref-kafka2', componentId: 'kafka', label: 'Kafka Events', icon: '🔥', color: '#f472b6', x: 690, y: 520 },
                { id: 'ref-elasticsearch', componentId: 'elasticsearch', label: 'Elastic Search', icon: '🔍', color: '#e50914', x: 870, y: 490 },
                { id: 'ref-spark', componentId: 'spark-engine', label: 'Spark', icon: '⚡', color: '#e50914', x: 870, y: 550 },
                { id: 'ref-samza', componentId: 'apache-samza', label: 'Apache Samza', icon: '🔄', color: '#e50914', x: 620, y: 580 },
            ],
            connections: [
                { from: 'ref-clients', to: 'ref-elb' },
                { from: 'ref-clients', to: 'ref-open-connect' },
                { from: 'ref-elb', to: 'ref-netty' },
                { from: 'ref-netty', to: 'ref-endpoint' },
                { from: 'ref-netty', to: 'ref-outbound' },
                { from: 'ref-endpoint', to: 'ref-hystrix' },
                { from: 'ref-inbound', to: 'ref-zuul' },
                { from: 'ref-hystrix', to: 'ref-microservices' },
                { from: 'ref-hystrix', to: 'ref-ev-cache' },
                { from: 'ref-microservices', to: 'ref-critical-ms' },
                { from: 'ref-microservices', to: 'ref-service-client' },
                { from: 'ref-service-client', to: 'ref-ms2' },
                { from: 'ref-critical-ms', to: 'ref-cassandra' },
                { from: 'ref-cassandra', to: 'ref-mysql' },
                { from: 'ref-zuul', to: 'ref-new-video' },
                { from: 'ref-new-video', to: 'ref-chukwa' },
                { from: 'ref-chukwa', to: 'ref-s3' },
                { from: 'ref-s3', to: 'ref-emr' },
                { from: 'ref-new-video', to: 'ref-transcoder' },
                { from: 'ref-transcoder', to: 'ref-workers' },
                { from: 'ref-workers', to: 'ref-kafka1' },
                { from: 'ref-kafka1', to: 'ref-kafka2' },
                { from: 'ref-kafka2', to: 'ref-elasticsearch' },
                { from: 'ref-kafka2', to: 'ref-spark' },
                { from: 'ref-kafka1', to: 'ref-samza' },
                { from: 'ref-emr', to: 'ref-elasticsearch' },
            ]
        },
    },
    {
        id: 'design-uber',
        title: 'Design Uber',
        difficulty: 'Hard',
        icon: '🚗',
        estimatedTime: '45 min',
        description: 'Design a ride-sharing platform with real-time location tracking, driver-rider matching, and dynamic pricing.',
        requirements: {
            functional: [
                'Riders request rides, drivers accept',
                'Real-time location tracking for both',
                'Match nearest available driver to rider',
                'Dynamic surge pricing based on demand',
                'Trip history, receipts, ratings',
            ],
            nonFunctional: [
                '10M daily active riders',
                '1M daily active drivers',
                'Match driver in < 30 seconds',
                'Location updates every 3 seconds',
                'High availability in metro areas',
            ]
        },
        hints: [
            'WebSocket server for real-time location updates',
            'Location service with geospatial index (Geohash/QuadTree)',
            'Redis for real-time driver positions',
            'Message queue for ride request matching',
            'Payment service for fare processing',
            'SQL DB for trip history, user data',
        ],
        expectedComponents: ['mobile-client', 'load-balancer', 'api-gateway', 'app-server', 'websocket-server', 'location-service', 'redis-cache', 'sql-db', 'nosql-db', 'message-queue', 'payment-service', 'notification-service'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'ub-rider', componentId: 'mobile-client', label: 'Rider App', icon: '📱', color: '#60a5fa', x: 60, y: 180 },
                { id: 'ub-driver', componentId: 'mobile-client', label: 'Driver App', icon: '📱', color: '#60a5fa', x: 60, y: 380 },
                // Networking
                { id: 'ub-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 240, y: 280 },
                { id: 'ub-gateway', componentId: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#22d3ee', x: 400, y: 280 },
                // Real-time
                { id: 'ub-ws', componentId: 'websocket-server', label: 'WebSocket Server', icon: '🔌', color: '#f472b6', x: 240, y: 100 },
                // Core Services
                { id: 'ub-ride', componentId: 'app-server', label: 'Ride Service', icon: '🖥️', color: '#a78bfa', x: 580, y: 140 },
                { id: 'ub-match', componentId: 'app-server', label: 'Matching Service', icon: '🖥️', color: '#a78bfa', x: 580, y: 280 },
                { id: 'ub-location', componentId: 'location-service', label: 'Location Service', icon: '📍', color: '#fbbf24', x: 580, y: 420 },
                // Payment & Notification
                { id: 'ub-payment', componentId: 'payment-service', label: 'Payment Service', icon: '💳', color: '#fbbf24', x: 800, y: 100 },
                { id: 'ub-notif', componentId: 'notification-service', label: 'Notifications', icon: '🔔', color: '#fbbf24', x: 800, y: 220 },
                // Queue
                { id: 'ub-queue', componentId: 'message-queue', label: 'Event Queue', icon: '📬', color: '#f472b6', x: 800, y: 340 },
                // Data
                { id: 'ub-redis', componentId: 'redis-cache', label: 'Driver Location Cache', icon: '💾', color: '#fb923c', x: 800, y: 460 },
                { id: 'ub-db', componentId: 'sql-db', label: 'Trip Database', icon: '🗄️', color: '#34d399', x: 580, y: 560 },
                { id: 'ub-analytics', componentId: 'data-warehouse', label: 'Analytics / Surge', icon: '🏗️', color: '#34d399', x: 800, y: 560 },
                // ML for pricing
                { id: 'ub-ml', componentId: 'ml-service', label: 'Surge Pricing ML', icon: '🤖', color: '#fbbf24', x: 400, y: 460 },
            ],
            connections: [
                // Clients → LB
                { from: 'ub-rider', to: 'ub-lb' },
                { from: 'ub-driver', to: 'ub-lb' },
                // Clients → WebSocket
                { from: 'ub-rider', to: 'ub-ws', label: 'Live location' },
                { from: 'ub-driver', to: 'ub-ws', label: 'Live location' },
                // LB → Gateway → Services
                { from: 'ub-lb', to: 'ub-gateway' },
                { from: 'ub-gateway', to: 'ub-ride', label: 'Request ride' },
                { from: 'ub-gateway', to: 'ub-match', label: 'Find driver' },
                { from: 'ub-gateway', to: 'ub-location', label: 'Update location' },
                // Matching
                { from: 'ub-match', to: 'ub-redis', label: 'Query nearby drivers' },
                { from: 'ub-match', to: 'ub-notif', label: 'Notify driver' },
                // Location
                { from: 'ub-location', to: 'ub-redis', label: 'Store position' },
                { from: 'ub-location', to: 'ub-ml' },
                // Ride lifecycle
                { from: 'ub-ride', to: 'ub-payment', label: 'Charge fare' },
                { from: 'ub-ride', to: 'ub-queue', label: 'Trip events' },
                { from: 'ub-ride', to: 'ub-db', label: 'Trip history' },
                // Analytics
                { from: 'ub-queue', to: 'ub-analytics' },
                { from: 'ub-ml', to: 'ub-analytics' },
            ]
        },
    },
    {
        id: 'design-whatsapp',
        title: 'Design WhatsApp',
        difficulty: 'Hard',
        icon: '💬',
        estimatedTime: '45 min',
        description: 'Design a real-time messaging platform with 1-on-1 chat, group messaging, read receipts, and end-to-end encryption.',
        requirements: {
            functional: [
                '1-on-1 and group messaging',
                'Message delivery & read receipts',
                'Online/offline presence indicators',
                'Media sharing (images, video, audio)',
                'End-to-end encryption',
            ],
            nonFunctional: [
                '2B users, 500M DAU',
                'Message delivery < 100ms (same region)',
                '100B messages per day',
                'Support offline message queuing',
                '99.999% availability',
            ]
        },
        hints: [
            'WebSocket server for real-time message delivery',
            'Message queue for offline message buffering',
            'NoSQL DB for message storage (Cassandra)',
            'Object storage for media files',
            'Redis for presence status and last seen',
            'Auth service for encryption key exchange',
        ],
        expectedComponents: ['mobile-client', 'load-balancer', 'api-gateway', 'app-server', 'websocket-server', 'nosql-db', 'object-storage', 'redis-cache', 'message-queue', 'auth-service', 'cdn', 'notification-service'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'wa-user1', componentId: 'mobile-client', label: 'User A', icon: '📱', color: '#60a5fa', x: 60, y: 120 },
                { id: 'wa-user2', componentId: 'mobile-client', label: 'User B', icon: '📱', color: '#60a5fa', x: 60, y: 340 },
                // Networking
                { id: 'wa-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 240, y: 230 },
                { id: 'wa-gateway', componentId: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#22d3ee', x: 400, y: 230 },
                // Real-time
                { id: 'wa-ws', componentId: 'websocket-server', label: 'WebSocket Server', icon: '🔌', color: '#f472b6', x: 240, y: 60 },
                // Core Services
                { id: 'wa-chat', componentId: 'app-server', label: 'Chat Service', icon: '🖥️', color: '#a78bfa', x: 560, y: 120 },
                { id: 'wa-group', componentId: 'app-server', label: 'Group Service', icon: '🖥️', color: '#a78bfa', x: 560, y: 260 },
                { id: 'wa-auth', componentId: 'auth-service', label: 'Auth Service', icon: '🔐', color: '#fbbf24', x: 560, y: 400 },
                { id: 'wa-presence', componentId: 'app-server', label: 'Presence Service', icon: '🖥️', color: '#a78bfa', x: 400, y: 400 },
                // Media
                { id: 'wa-media', componentId: 'object-storage', label: 'Media Storage', icon: '☁️', color: '#34d399', x: 400, y: 540 },
                { id: 'wa-cdn', componentId: 'cdn', label: 'CDN', icon: '🌍', color: '#22d3ee', x: 240, y: 480 },
                // Queue & Notifications
                { id: 'wa-queue', componentId: 'message-queue', label: 'Message Queue', icon: '📬', color: '#f472b6', x: 760, y: 60 },
                { id: 'wa-notif', componentId: 'notification-service', label: 'Push Notifications', icon: '🔔', color: '#fbbf24', x: 760, y: 180 },
                // Data
                { id: 'wa-msgdb', componentId: 'nosql-db', label: 'Message Store', icon: '📦', color: '#34d399', x: 760, y: 320 },
                { id: 'wa-redis', componentId: 'redis-cache', label: 'Presence Cache', icon: '💾', color: '#fb923c', x: 560, y: 540 },
                { id: 'wa-userdb', componentId: 'sql-db', label: 'User Database', icon: '🗄️', color: '#34d399', x: 760, y: 460 },
            ],
            connections: [
                // Clients → LB & WebSocket
                { from: 'wa-user1', to: 'wa-lb' },
                { from: 'wa-user2', to: 'wa-lb' },
                { from: 'wa-user1', to: 'wa-ws', label: 'Persistent' },
                { from: 'wa-user2', to: 'wa-ws', label: 'Persistent' },
                // LB → Gateway
                { from: 'wa-lb', to: 'wa-gateway' },
                // Gateway → Services
                { from: 'wa-gateway', to: 'wa-chat', label: 'Send message' },
                { from: 'wa-gateway', to: 'wa-group', label: 'Group ops' },
                { from: 'wa-gateway', to: 'wa-auth', label: 'Auth' },
                { from: 'wa-gateway', to: 'wa-presence' },
                // Chat Service
                { from: 'wa-chat', to: 'wa-msgdb', label: 'Persist' },
                { from: 'wa-chat', to: 'wa-queue', label: 'Offline delivery' },
                { from: 'wa-queue', to: 'wa-notif', label: 'Push' },
                // Group
                { from: 'wa-group', to: 'wa-msgdb' },
                // Media
                { from: 'wa-chat', to: 'wa-media', label: 'Upload media' },
                { from: 'wa-cdn', to: 'wa-media' },
                // Presence
                { from: 'wa-presence', to: 'wa-redis', label: 'Online status' },
                // Auth
                { from: 'wa-auth', to: 'wa-userdb' },
            ]
        },
    },
    {
        id: 'design-youtube',
        title: 'Design YouTube',
        difficulty: 'Hard',
        icon: '📺',
        estimatedTime: '45 min',
        description: 'Design a video sharing platform with upload, transcoding, streaming, search, comments, and recommendations.',
        requirements: {
            functional: [
                'Upload videos (up to 12 hours)',
                'Stream videos with quality selection',
                'Search videos by title, tags, description',
                'Like, comment, subscribe, share',
                'Personalized video recommendations',
            ],
            nonFunctional: [
                '2B monthly active users',
                '500 hours of video uploaded per minute',
                'Playback start < 2 seconds',
                'Global CDN for low latency',
                'Eventual consistency for view counts',
            ]
        },
        hints: [
            'Object storage for video files',
            'Encoding service with multiple output resolutions',
            'CDN for global video delivery',
            'Search service for video discovery',
            'NoSQL for video metadata, comments',
            'Kafka for async processing (recommendations, analytics)',
        ],
        expectedComponents: ['web-client', 'mobile-client', 'cdn', 'load-balancer', 'api-gateway', 'app-server', 'object-storage', 'encoding-service', 'message-queue', 'sql-db', 'nosql-db', 'redis-cache', 'search-service', 'ml-service'],
        referenceArchitecture: {
            nodes: [
                { id: 'yt-mobile1', componentId: 'mobile-client', label: 'Mobile Client', icon: '📱', color: '#60a5fa', x: 80, y: 60 },
                { id: 'yt-mobile2', componentId: 'mobile-client', label: 'Mobile Client', icon: '📱', color: '#60a5fa', x: 200, y: 60 },
                { id: 'yt-web', componentId: 'web-client', label: 'Web Client', icon: '🌐', color: '#60a5fa', x: 340, y: 60 },
                { id: 'yt-cdn', componentId: 'cdn', label: 'CDN', icon: '🌍', color: '#22d3ee', x: 560, y: 20 },
                { id: 'yt-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 120, y: 220 },
                { id: 'yt-web-server', componentId: 'app-server', label: 'Web Server', icon: '🖥️', color: '#a78bfa', x: 340, y: 220 },
                { id: 'yt-media-cache', componentId: 'media-cache', label: 'Media Cache', icon: '🎞️', color: '#fb923c', x: 560, y: 160 },
                { id: 'yt-media-storage', componentId: 'object-storage', label: 'Media Storage (S3)', icon: '☁️', color: '#34d399', x: 560, y: 280 },
                { id: 'yt-proc-queue', componentId: 'message-queue', label: 'Processing Queue', icon: '📬', color: '#f472b6', x: 120, y: 400 },
                { id: 'yt-transcoder', componentId: 'encoding-service', label: 'Transcoding Servers', icon: '🎬', color: '#fbbf24', x: 340, y: 400 },
                { id: 'yt-thumb-store', componentId: 'thumbnail-storage', label: 'Thumbnail Storage', icon: '🖼️', color: '#34d399', x: 560, y: 400 },
                { id: 'yt-app-server', componentId: 'app-server', label: 'Application Servers', icon: '🖥️', color: '#a78bfa', x: 120, y: 540 },
                { id: 'yt-user-db', componentId: 'sql-db', label: 'User Database', icon: '🗄️', color: '#34d399', x: 120, y: 680 },
                { id: 'yt-metadata-db', componentId: 'nosql-db', label: 'Metadata Database', icon: '📦', color: '#34d399', x: 380, y: 680 },
                { id: 'yt-metadata-cache', componentId: 'redis-cache', label: 'Metadata Cache', icon: '💾', color: '#fb923c', x: 580, y: 680 },
            ],
            connections: [
                { from: 'yt-mobile1', to: 'yt-lb', label: 'Watch' },
                { from: 'yt-mobile2', to: 'yt-lb', label: 'Watch' },
                { from: 'yt-web', to: 'yt-lb', label: 'Upload Videos' },
                { from: 'yt-web', to: 'yt-cdn', label: 'Popular Videos' },
                { from: 'yt-lb', to: 'yt-web-server' },
                { from: 'yt-web-server', to: 'yt-media-cache' },
                { from: 'yt-web-server', to: 'yt-media-storage' },
                { from: 'yt-media-cache', to: 'yt-media-storage' },
                { from: 'yt-app-server', to: 'yt-proc-queue' },
                { from: 'yt-proc-queue', to: 'yt-transcoder' },
                { from: 'yt-transcoder', to: 'yt-thumb-store' },
                { from: 'yt-transcoder', to: 'yt-app-server' },
                { from: 'yt-app-server', to: 'yt-user-db' },
                { from: 'yt-app-server', to: 'yt-metadata-db' },
                { from: 'yt-metadata-db', to: 'yt-metadata-cache' },
            ]
        },
    },
    {
        id: 'design-instagram',
        title: 'Design Instagram',
        difficulty: 'Hard',
        icon: '📸',
        estimatedTime: '40 min',
        description: 'Design a photo/video sharing platform with feed, stories, explore, DMs, and content moderation.',
        requirements: {
            functional: [
                'Post photos/videos with captions',
                'Home feed of followed users\' posts',
                'Stories that expire after 24h',
                'Explore page with trending content',
                'Direct messaging between users',
            ],
            nonFunctional: [
                '2B monthly active users, 500M DAU',
                '100M photos uploaded per day',
                'Feed load < 200ms',
                'Global availability',
                'Content moderation at scale',
            ]
        },
        hints: [
            'Object storage + CDN for images/videos',
            'Fan-out service for feed generation',
            'Redis for caching hot feeds',
            'ML service for content moderation',
            'Search service for explore page',
            'WebSocket for real-time DMs',
        ],
        expectedComponents: ['mobile-client', 'cdn', 'load-balancer', 'api-gateway', 'app-server', 'object-storage', 'sql-db', 'nosql-db', 'redis-cache', 'message-queue', 'search-service', 'ml-service', 'websocket-server', 'notification-service'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'ig-mobile', componentId: 'mobile-client', label: 'Mobile App', icon: '📱', color: '#60a5fa', x: 60, y: 200 },
                { id: 'ig-web', componentId: 'web-client', label: 'Web Client', icon: '🌐', color: '#60a5fa', x: 60, y: 360 },
                // CDN
                { id: 'ig-cdn', componentId: 'cdn', label: 'CDN (Images/Video)', icon: '🌍', color: '#22d3ee', x: 60, y: 540 },
                // Networking
                { id: 'ig-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 260, y: 280 },
                { id: 'ig-gateway', componentId: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#22d3ee', x: 420, y: 280 },
                // Core Services
                { id: 'ig-feed', componentId: 'app-server', label: 'Feed Service', icon: '🖥️', color: '#a78bfa', x: 600, y: 140 },
                { id: 'ig-post', componentId: 'app-server', label: 'Post Service', icon: '🖥️', color: '#a78bfa', x: 600, y: 280 },
                { id: 'ig-story', componentId: 'app-server', label: 'Stories Service', icon: '🖥️', color: '#a78bfa', x: 600, y: 420 },
                // Fanout
                { id: 'ig-fanout', componentId: 'message-queue', label: 'Fan-out Queue', icon: '📬', color: '#f472b6', x: 800, y: 140 },
                // Search & ML
                { id: 'ig-search', componentId: 'search-service', label: 'Explore / Search', icon: '🔍', color: '#fbbf24', x: 800, y: 280 },
                { id: 'ig-ml', componentId: 'ml-service', label: 'Content Moderation', icon: '🤖', color: '#fbbf24', x: 800, y: 420 },
                // Messaging
                { id: 'ig-ws', componentId: 'websocket-server', label: 'DM WebSocket', icon: '🔌', color: '#f472b6', x: 420, y: 480 },
                { id: 'ig-notif', componentId: 'notification-service', label: 'Notifications', icon: '🔔', color: '#fbbf24', x: 420, y: 140 },
                // Data
                { id: 'ig-redis', componentId: 'redis-cache', label: 'Feed Cache', icon: '💾', color: '#fb923c', x: 960, y: 100 },
                { id: 'ig-media', componentId: 'object-storage', label: 'Media Storage (S3)', icon: '☁️', color: '#34d399', x: 260, y: 540 },
                { id: 'ig-userdb', componentId: 'sql-db', label: 'User Database', icon: '🗄️', color: '#34d399', x: 960, y: 240 },
                { id: 'ig-postdb', componentId: 'nosql-db', label: 'Posts / Comments DB', icon: '📦', color: '#34d399', x: 960, y: 380 },
            ],
            connections: [
                // Clients → LB
                { from: 'ig-mobile', to: 'ig-lb' },
                { from: 'ig-web', to: 'ig-lb' },
                // CDN
                { from: 'ig-mobile', to: 'ig-cdn', label: 'Fetch media' },
                { from: 'ig-cdn', to: 'ig-media' },
                // LB → Gateway → Services
                { from: 'ig-lb', to: 'ig-gateway' },
                { from: 'ig-gateway', to: 'ig-feed', label: 'Home feed' },
                { from: 'ig-gateway', to: 'ig-post', label: 'Create post' },
                { from: 'ig-gateway', to: 'ig-story', label: 'Stories' },
                { from: 'ig-gateway', to: 'ig-ws', label: 'DMs' },
                { from: 'ig-gateway', to: 'ig-notif' },
                // Post → Media, DB, Fanout
                { from: 'ig-post', to: 'ig-media', label: 'Upload' },
                { from: 'ig-post', to: 'ig-postdb', label: 'Store' },
                { from: 'ig-post', to: 'ig-fanout', label: 'Fan-out' },
                { from: 'ig-post', to: 'ig-ml', label: 'Moderate' },
                // Feed
                { from: 'ig-feed', to: 'ig-redis', label: 'Read cache' },
                { from: 'ig-fanout', to: 'ig-redis', label: 'Update feeds' },
                // Stories
                { from: 'ig-story', to: 'ig-media' },
                { from: 'ig-story', to: 'ig-postdb' },
                // Search
                { from: 'ig-search', to: 'ig-postdb' },
                { from: 'ig-search', to: 'ig-userdb' },
                // Auth
                { from: 'ig-post', to: 'ig-userdb' },
            ]
        },
    },
    {
        id: 'design-rate-limiter',
        title: 'Design Rate Limiter',
        difficulty: 'Medium',
        icon: '🚦',
        estimatedTime: '30 min',
        description: 'Design a distributed rate limiting service that protects APIs from abuse and ensures fair usage.',
        requirements: {
            functional: [
                'Rate limit by user ID, IP, or API key',
                'Support multiple algorithms (token bucket, sliding window)',
                'Configurable limits per endpoint',
                'Return HTTP 429 with Retry-After',
                'Dashboard for monitoring rate limit hits',
            ],
            nonFunctional: [
                'Process 10M requests/second',
                'Decision latency < 1ms',
                'Distributed across multiple data centers',
                'Consistent limiting (no bypass via server switching)',
                '99.999% availability',
            ]
        },
        hints: [
            'Redis for distributed atomic counters',
            'API Gateway as the enforcement point',
            'Lua scripts in Redis for atomic operations',
            'Metrics service for monitoring',
            'Consider local + distributed hybrid approach',
        ],
        expectedComponents: ['web-client', 'api-gateway', 'app-server', 'redis-cache', 'rate-limiter', 'metrics', 'logging'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'rl-web', componentId: 'web-client', label: 'Client Apps', icon: '🌐', color: '#60a5fa', x: 60, y: 220 },
                // Gateway
                { id: 'rl-gateway', componentId: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#22d3ee', x: 260, y: 220 },
                // Rate Limiter
                { id: 'rl-limiter', componentId: 'rate-limiter', label: 'Rate Limiter', icon: '🚦', color: '#fbbf24', x: 440, y: 120 },
                // Redis
                { id: 'rl-redis', componentId: 'redis-cache', label: 'Redis Counters', icon: '💾', color: '#fb923c', x: 660, y: 120 },
                // App Server
                { id: 'rl-app', componentId: 'app-server', label: 'App Server', icon: '🖥️', color: '#a78bfa', x: 440, y: 320 },
                // Rules DB
                { id: 'rl-db', componentId: 'sql-db', label: 'Rules Database', icon: '🗄️', color: '#34d399', x: 660, y: 320 },
                // Monitoring
                { id: 'rl-metrics', componentId: 'metrics', label: 'Metrics / Grafana', icon: '📊', color: '#8b5cf6', x: 660, y: 220 },
                { id: 'rl-logs', componentId: 'logging', label: 'Log Aggregator', icon: '📋', color: '#8b5cf6', x: 440, y: 440 },
                // Dashboard
                { id: 'rl-dashboard', componentId: 'web-client', label: 'Admin Dashboard', icon: '🌐', color: '#60a5fa', x: 660, y: 440 },
            ],
            connections: [
                // Client → Gateway
                { from: 'rl-web', to: 'rl-gateway', label: 'API Request' },
                // Gateway checks rate limiter
                { from: 'rl-gateway', to: 'rl-limiter', label: 'Check limit' },
                { from: 'rl-limiter', to: 'rl-redis', label: 'Incr counter' },
                // If allowed → App
                { from: 'rl-gateway', to: 'rl-app', label: 'Forward (allowed)' },
                // Rules
                { from: 'rl-limiter', to: 'rl-db', label: 'Load rules' },
                // Monitoring
                { from: 'rl-limiter', to: 'rl-metrics', label: 'Emit metrics' },
                { from: 'rl-limiter', to: 'rl-logs', label: '429 events' },
                // Dashboard reads
                { from: 'rl-dashboard', to: 'rl-metrics' },
                { from: 'rl-dashboard', to: 'rl-db', label: 'Manage rules' },
            ]
        },
    },
    {
        id: 'design-notification',
        title: 'Design Notification System',
        difficulty: 'Medium',
        icon: '🔔',
        estimatedTime: '35 min',
        description: 'Design a notification system supporting push, email, SMS, and in-app delivery with user preferences.',
        requirements: {
            functional: [
                'Multi-channel: push, email, SMS, in-app',
                'User notification preferences (opt-in/out)',
                'Priority levels (critical, high, low)',
                'Template-based notifications with i18n',
                'Delivery tracking and analytics',
            ],
            nonFunctional: [
                '10B notifications per day',
                'Critical notifications delivered in < 5 seconds',
                'At-least-once delivery guarantee',
                '99.9% delivery rate',
                'Rate limiting per user',
            ]
        },
        hints: [
            'Message queue with priority queues',
            'Separate worker pools per channel',
            'SQL DB for user preferences',
            'NoSQL for notification history',
            'Pub/Sub for fan-out to multiple channels',
        ],
        expectedComponents: ['app-server', 'message-queue', 'worker', 'sql-db', 'nosql-db', 'redis-cache', 'notification-service', 'pub-sub', 'metrics'],
        referenceArchitecture: {
            nodes: [
                // Source
                { id: 'ns-source', componentId: 'app-server', label: 'Event Source', icon: '🖥️', color: '#a78bfa', x: 60, y: 260 },
                // Priority Queue
                { id: 'ns-queue', componentId: 'message-queue', label: 'Priority Queue', icon: '📬', color: '#f472b6', x: 260, y: 260 },
                // Notification Service
                { id: 'ns-service', componentId: 'notification-service', label: 'Notification Router', icon: '🔔', color: '#fbbf24', x: 460, y: 260 },
                // Pub/Sub
                { id: 'ns-pubsub', componentId: 'pub-sub', label: 'Pub/Sub Fan-out', icon: '📢', color: '#f472b6', x: 460, y: 100 },
                // Workers
                { id: 'ns-push', componentId: 'worker', label: 'Push Worker', icon: '⚙️', color: '#a78bfa', x: 680, y: 100 },
                { id: 'ns-email', componentId: 'worker', label: 'Email Worker', icon: '⚙️', color: '#a78bfa', x: 680, y: 260 },
                { id: 'ns-sms', componentId: 'worker', label: 'SMS Worker', icon: '⚙️', color: '#a78bfa', x: 680, y: 420 },
                // External
                { id: 'ns-apns', componentId: 'app-server', label: 'APNs / FCM', icon: '🖥️', color: '#a78bfa', x: 880, y: 100 },
                { id: 'ns-smtp', componentId: 'app-server', label: 'SMTP / SES', icon: '🖥️', color: '#a78bfa', x: 880, y: 260 },
                { id: 'ns-twilio', componentId: 'app-server', label: 'Twilio / SNS', icon: '🖥️', color: '#a78bfa', x: 880, y: 420 },
                // Data
                { id: 'ns-prefs', componentId: 'sql-db', label: 'User Preferences', icon: '🗄️', color: '#34d399', x: 260, y: 440 },
                { id: 'ns-history', componentId: 'nosql-db', label: 'Notification History', icon: '📦', color: '#34d399', x: 460, y: 440 },
                { id: 'ns-redis', componentId: 'redis-cache', label: 'Dedup Cache', icon: '💾', color: '#fb923c', x: 260, y: 100 },
                { id: 'ns-metrics', componentId: 'metrics', label: 'Delivery Metrics', icon: '📊', color: '#8b5cf6', x: 680, y: 540 },
            ],
            connections: [
                // Source → Queue → Service
                { from: 'ns-source', to: 'ns-queue', label: 'Trigger event' },
                { from: 'ns-queue', to: 'ns-service' },
                // Service checks dedup & prefs
                { from: 'ns-service', to: 'ns-redis', label: 'Dedup check' },
                { from: 'ns-service', to: 'ns-prefs', label: 'Check prefs' },
                { from: 'ns-service', to: 'ns-history', label: 'Log' },
                // Service → Pub/Sub → Workers
                { from: 'ns-service', to: 'ns-pubsub', label: 'Fan-out' },
                { from: 'ns-pubsub', to: 'ns-push' },
                { from: 'ns-pubsub', to: 'ns-email' },
                { from: 'ns-pubsub', to: 'ns-sms' },
                // Workers → External
                { from: 'ns-push', to: 'ns-apns' },
                { from: 'ns-email', to: 'ns-smtp' },
                { from: 'ns-sms', to: 'ns-twilio' },
                // Metrics
                { from: 'ns-push', to: 'ns-metrics', label: 'Delivery status' },
                { from: 'ns-email', to: 'ns-metrics' },
                { from: 'ns-sms', to: 'ns-metrics' },
            ]
        },
    },
    {
        id: 'design-typeahead',
        title: 'Design Typeahead / Autocomplete',
        difficulty: 'Medium',
        icon: '⌨️',
        estimatedTime: '30 min',
        description: 'Design a real-time autocomplete/typeahead system like Google Search suggestions.',
        requirements: {
            functional: [
                'Return top suggestions as user types',
                'Suggestions ranked by popularity/recency',
                'Support spell correction',
                'Personalized suggestions per user',
                'Handle trending/hot queries',
            ],
            nonFunctional: [
                '5B search queries per day',
                'Response time < 100ms (P99)',
                'Update suggestions data hourly',
                'Global low-latency access',
                'Fault tolerant',
            ]
        },
        hints: [
            'Trie data structure for prefix matching',
            'Redis cache for top-K results per prefix',
            'CDN for caching popular prefixes',
            'Kafka for aggregating query frequencies',
            'Offline batch job to rebuild trie hourly',
        ],
        expectedComponents: ['web-client', 'cdn', 'load-balancer', 'app-server', 'redis-cache', 'nosql-db', 'kafka', 'worker', 'search-service'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'ta-web', componentId: 'web-client', label: 'Search Client', icon: '🌐', color: '#60a5fa', x: 60, y: 200 },
                // CDN
                { id: 'ta-cdn', componentId: 'cdn', label: 'CDN (Popular Prefixes)', icon: '🌍', color: '#22d3ee', x: 60, y: 380 },
                // Networking
                { id: 'ta-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 260, y: 200 },
                // Suggestion Service
                { id: 'ta-server', componentId: 'app-server', label: 'Suggestion Server', icon: '🖥️', color: '#a78bfa', x: 460, y: 200 },
                // Cache
                { id: 'ta-cache', componentId: 'redis-cache', label: 'Top-K Cache', icon: '💾', color: '#fb923c', x: 460, y: 60 },
                // Trie Storage
                { id: 'ta-triedb', componentId: 'nosql-db', label: 'Trie Data Store', icon: '📦', color: '#34d399', x: 660, y: 200 },
                // Aggregation pipeline
                { id: 'ta-kafka', componentId: 'kafka', label: 'Query Stream', icon: '🔥', color: '#f472b6', x: 260, y: 400 },
                { id: 'ta-worker', componentId: 'worker', label: 'Aggregation Worker', icon: '⚙️', color: '#a78bfa', x: 460, y: 400 },
                // Scheduler
                { id: 'ta-scheduler', componentId: 'scheduler', label: 'Trie Rebuild Job', icon: '⏰', color: '#a78bfa', x: 660, y: 400 },
                // Search
                { id: 'ta-search', componentId: 'search-service', label: 'Search Service', icon: '🔍', color: '#fbbf24', x: 660, y: 60 },
            ],
            connections: [
                // Client → CDN + LB
                { from: 'ta-web', to: 'ta-lb', label: 'Keystroke' },
                { from: 'ta-web', to: 'ta-cdn', label: 'Cached prefixes' },
                // LB → Server
                { from: 'ta-lb', to: 'ta-server' },
                // Server → Cache & DB
                { from: 'ta-server', to: 'ta-cache', label: 'Lookup cache' },
                { from: 'ta-cache', to: 'ta-triedb', label: 'Cache miss' },
                { from: 'ta-server', to: 'ta-search', label: 'Full search' },
                // Analytics pipeline
                { from: 'ta-server', to: 'ta-kafka', label: 'Log query' },
                { from: 'ta-kafka', to: 'ta-worker', label: 'Aggregate' },
                { from: 'ta-worker', to: 'ta-triedb', label: 'Update frequencies' },
                // Scheduler
                { from: 'ta-scheduler', to: 'ta-triedb', label: 'Rebuild trie' },
                { from: 'ta-scheduler', to: 'ta-cache', label: 'Warm cache' },
            ]
        },
    },
    {
        id: 'design-web-crawler',
        title: 'Design Web Crawler',
        difficulty: 'Hard',
        icon: '🕷️',
        estimatedTime: '40 min',
        description: 'Design a distributed web crawler that indexes billions of pages for a search engine.',
        requirements: {
            functional: [
                'Crawl web pages starting from seed URLs',
                'Extract and follow hyperlinks',
                'Handle robots.txt and politeness policies',
                'Detect and handle duplicate content',
                'Store crawled content for indexing',
            ],
            nonFunctional: [
                'Crawl 1B pages per month',
                'Politeness: max 1 req/sec per domain',
                'Fault tolerant — resume after failures',
                'Distributed across 1000+ machines',
                'Prioritize important pages',
            ]
        },
        hints: [
            'URL frontier (priority queue) for URLs to crawl',
            'Worker pool for parallel fetching',
            'DNS resolver for domain resolution',
            'Object storage for raw HTML content',
            'NoSQL DB for URL metadata and dedup',
            'Message queue for distributing URLs to workers',
        ],
        expectedComponents: ['dns', 'load-balancer', 'app-server', 'worker', 'message-queue', 'nosql-db', 'object-storage', 'redis-cache', 'scheduler', 'metrics'],
        referenceArchitecture: {
            nodes: [
                // Seed URLs
                { id: 'wc-seed', componentId: 'app-server', label: 'Seed URL Service', icon: '🖥️', color: '#a78bfa', x: 60, y: 200 },
                // URL Frontier
                { id: 'wc-frontier', componentId: 'message-queue', label: 'URL Frontier', icon: '📬', color: '#f472b6', x: 260, y: 200 },
                // Scheduler
                { id: 'wc-scheduler', componentId: 'scheduler', label: 'Prioritizer', icon: '⏰', color: '#a78bfa', x: 260, y: 60 },
                // DNS
                { id: 'wc-dns', componentId: 'dns', label: 'DNS Resolver', icon: '🔗', color: '#22d3ee', x: 460, y: 60 },
                // Fetcher Workers
                { id: 'wc-fetcher1', componentId: 'worker', label: 'Fetcher Worker', icon: '⚙️', color: '#a78bfa', x: 460, y: 200 },
                { id: 'wc-fetcher2', componentId: 'worker', label: 'Fetcher Worker', icon: '⚙️', color: '#a78bfa', x: 460, y: 340 },
                // Content Parser
                { id: 'wc-parser', componentId: 'app-server', label: 'HTML Parser', icon: '🖥️', color: '#a78bfa', x: 660, y: 200 },
                // Dedup
                { id: 'wc-dedup', componentId: 'redis-cache', label: 'URL Dedup (Bloom)', icon: '💾', color: '#fb923c', x: 260, y: 400 },
                // Storage
                { id: 'wc-storage', componentId: 'object-storage', label: 'Raw HTML Store', icon: '☁️', color: '#34d399', x: 660, y: 400 },
                { id: 'wc-urldb', componentId: 'nosql-db', label: 'URL Metadata DB', icon: '📦', color: '#34d399', x: 860, y: 200 },
                // Robots.txt
                { id: 'wc-robots', componentId: 'redis-cache', label: 'Robots.txt Cache', icon: '💾', color: '#fb923c', x: 660, y: 60 },
                // Monitoring
                { id: 'wc-metrics', componentId: 'metrics', label: 'Crawl Metrics', icon: '📊', color: '#8b5cf6', x: 860, y: 400 },
            ],
            connections: [
                // Seed → Frontier
                { from: 'wc-seed', to: 'wc-frontier', label: 'Enqueue URLs' },
                // Prioritizer
                { from: 'wc-scheduler', to: 'wc-frontier', label: 'Prioritize' },
                // Frontier → Fetchers
                { from: 'wc-frontier', to: 'wc-fetcher1', label: 'Dequeue' },
                { from: 'wc-frontier', to: 'wc-fetcher2', label: 'Dequeue' },
                // Fetchers → DNS & Robots
                { from: 'wc-fetcher1', to: 'wc-dns', label: 'Resolve' },
                { from: 'wc-fetcher1', to: 'wc-robots', label: 'Check policy' },
                // Fetcher → Parser
                { from: 'wc-fetcher1', to: 'wc-parser' },
                { from: 'wc-fetcher2', to: 'wc-parser' },
                // Parser → Storage & Re-enqueue
                { from: 'wc-parser', to: 'wc-storage', label: 'Store HTML' },
                { from: 'wc-parser', to: 'wc-urldb', label: 'Store metadata' },
                { from: 'wc-parser', to: 'wc-dedup', label: 'Check dedup' },
                { from: 'wc-dedup', to: 'wc-frontier', label: 'New URLs' },
                // Metrics
                { from: 'wc-fetcher1', to: 'wc-metrics' },
            ]
        },
    },
    {
        id: 'design-payment',
        title: 'Design Payment System',
        difficulty: 'Hard',
        icon: '💳',
        estimatedTime: '40 min',
        description: 'Design a payment processing system handling transactions, refunds, and multi-currency support.',
        requirements: {
            functional: [
                'Process credit card and bank transfers',
                'Handle refunds and chargebacks',
                'Multi-currency support with conversion',
                'Transaction history and receipts',
                'Recurring billing / subscriptions',
            ],
            nonFunctional: [
                '10M transactions per day',
                'Transaction processing < 2 seconds',
                'Zero data loss (financial data)',
                'PCI DSS compliance',
                '99.999% availability',
            ]
        },
        hints: [
            'SQL DB with ACID transactions for ledger',
            'Idempotency keys for every transaction',
            'Message queue for async notifications',
            'Auth service for PCI-compliant tokenization',
            'Rate limiter to prevent fraud',
            'Distributed locking for double-spend prevention',
        ],
        expectedComponents: ['web-client', 'mobile-client', 'load-balancer', 'api-gateway', 'app-server', 'sql-db', 'redis-cache', 'message-queue', 'payment-service', 'auth-service', 'notification-service', 'rate-limiter', 'logging'],
        referenceArchitecture: {
            nodes: [
                // Clients
                { id: 'pay-web', componentId: 'web-client', label: 'Web Client', icon: '🌐', color: '#60a5fa', x: 60, y: 160 },
                { id: 'pay-mobile', componentId: 'mobile-client', label: 'Mobile App', icon: '📱', color: '#60a5fa', x: 60, y: 340 },
                // Networking
                { id: 'pay-lb', componentId: 'load-balancer', label: 'Load Balancer', icon: '⚖️', color: '#22d3ee', x: 240, y: 250 },
                { id: 'pay-gateway', componentId: 'api-gateway', label: 'API Gateway', icon: '🚪', color: '#22d3ee', x: 400, y: 250 },
                // Rate limiter
                { id: 'pay-ratelimit', componentId: 'rate-limiter', label: 'Rate Limiter', icon: '🚦', color: '#fbbf24', x: 400, y: 100 },
                // Core
                { id: 'pay-service', componentId: 'payment-service', label: 'Payment Service', icon: '💳', color: '#fbbf24', x: 600, y: 180 },
                { id: 'pay-auth', componentId: 'auth-service', label: 'Tokenization', icon: '🔐', color: '#fbbf24', x: 600, y: 320 },
                // Idempotency
                { id: 'pay-redis', componentId: 'redis-cache', label: 'Idempotency Cache', icon: '💾', color: '#fb923c', x: 600, y: 60 },
                // External
                { id: 'pay-stripe', componentId: 'app-server', label: 'Stripe / PayPal', icon: '🖥️', color: '#a78bfa', x: 800, y: 100 },
                // Ledger
                { id: 'pay-ledger', componentId: 'sql-db', label: 'Ledger DB (ACID)', icon: '🗄️', color: '#34d399', x: 800, y: 250 },
                // Async
                { id: 'pay-queue', componentId: 'message-queue', label: 'Event Queue', icon: '📬', color: '#f472b6', x: 800, y: 400 },
                { id: 'pay-notif', componentId: 'notification-service', label: 'Receipts/Alerts', icon: '🔔', color: '#fbbf24', x: 600, y: 480 },
                // Audit
                { id: 'pay-logs', componentId: 'logging', label: 'Audit Log', icon: '📋', color: '#8b5cf6', x: 400, y: 440 },
                // Refund
                { id: 'pay-worker', componentId: 'worker', label: 'Refund Worker', icon: '⚙️', color: '#a78bfa', x: 800, y: 520 },
            ],
            connections: [
                // Clients → LB
                { from: 'pay-web', to: 'pay-lb' },
                { from: 'pay-mobile', to: 'pay-lb' },
                // LB → Gateway
                { from: 'pay-lb', to: 'pay-gateway' },
                // Gateway → Rate limiter & Service
                { from: 'pay-gateway', to: 'pay-ratelimit', label: 'Fraud check' },
                { from: 'pay-gateway', to: 'pay-service', label: 'Process payment' },
                // Service → Idempotency
                { from: 'pay-service', to: 'pay-redis', label: 'Check idempotency' },
                // Service → External
                { from: 'pay-service', to: 'pay-stripe', label: 'Charge' },
                { from: 'pay-service', to: 'pay-auth', label: 'Tokenize card' },
                // Service → Ledger
                { from: 'pay-service', to: 'pay-ledger', label: 'Record txn' },
                // Async notifications
                { from: 'pay-service', to: 'pay-queue', label: 'Txn event' },
                { from: 'pay-queue', to: 'pay-notif', label: 'Send receipt' },
                { from: 'pay-queue', to: 'pay-worker', label: 'Refund job' },
                // Audit
                { from: 'pay-service', to: 'pay-logs', label: 'Audit trail' },
            ]
        },
    },
    {
        id: 'design-telegram',
        title: 'Design Telegram',
        difficulty: 'Hard',
        icon: '✈️',
        estimatedTime: '45 min',
        description: 'Design a cloud-based messaging platform with 1-on-1 chat, groups, channels, media sharing, multi-device sync, and end-to-end encryption.',
        requirements: {
            functional: [
                '1-on-1 and group messaging with real-time delivery',
                'Channels for broadcasting to unlimited subscribers',
                'Media sharing (photos, videos, documents, voice)',
                'Multi-device sync with seamless session hand-off',
                'End-to-end encryption for secret chats',
                'Online/offline status and last seen indicators',
            ],
            nonFunctional: [
                '800M+ monthly active users, 500M DAU',
                'Message delivery < 100ms (same region)',
                '80B+ messages per day',
                'Support offline message queuing & delivery',
                'Multi-datacenter deployment with failover',
                '99.999% availability',
            ]
        },
        hints: [
            'WebSocket for persistent real-time connections',
            'Authentication gateway for encryption & auth handshake',
            'Separate services: Chat, Group, Session, Last Seen, Relay',
            'Asset service for media upload with CDN delivery',
            'Storage replicas for media redundancy across DCs',
            'Memcached for group metadata caching',
            'Dedicated databases: GroupDB, SessionDB, StatusDB',
        ],
        expectedComponents: ['mobile-client', 'websocket-server', 'auth-gateway', 'chat-service', 'group-service', 'session-service', 'last-seen-svc', 'relay-service', 'asset-service', 'cdn', 'object-storage', 'notification-service', 'memcached', 'unread-messages'],
        referenceArchitecture: {
            nodes: [
                // Clients (top row)
                { id: 'tg-client1', componentId: 'mobile-client', label: 'Client 1', icon: '📱', color: '#60a5fa', x: 80, y: 40 },
                { id: 'tg-client2', componentId: 'mobile-client', label: 'Client 2', icon: '📱', color: '#60a5fa', x: 220, y: 40 },
                { id: 'tg-client3', componentId: 'mobile-client', label: 'Client 3', icon: '📱', color: '#60a5fa', x: 360, y: 40 },
                { id: 'tg-client4', componentId: 'mobile-client', label: 'Client 4', icon: '📱', color: '#60a5fa', x: 500, y: 40 },
                { id: 'tg-notif', componentId: 'notification-service', label: 'Notification Server', icon: '🔔', color: '#fbbf24', x: 740, y: 40 },
                // Auth & WebSocket layer
                { id: 'tg-auth', componentId: 'auth-gateway', label: 'Auth Gateway', icon: '🔐', color: '#0088cc', x: 80, y: 200 },
                { id: 'tg-ws', componentId: 'websocket-server', label: 'WebSocket', icon: '🔌', color: '#f472b6', x: 260, y: 200 },
                // Asset & Media layer
                { id: 'tg-asset', componentId: 'asset-service', label: 'Asset Service', icon: '📎', color: '#0088cc', x: 420, y: 260 },
                { id: 'tg-cdn', componentId: 'cdn', label: 'CDN', icon: '🌍', color: '#22d3ee', x: 640, y: 180 },
                { id: 'tg-media', componentId: 'object-storage', label: 'Media Storage (HDFS/S3)', icon: '☁️', color: '#34d399', x: 640, y: 310 },
                { id: 'tg-replica1', componentId: 'storage-replica', label: 'Storage Replica', icon: '💾', color: '#0088cc', x: 840, y: 220 },
                { id: 'tg-replica2', componentId: 'storage-replica', label: 'Storage Replica', icon: '💾', color: '#0088cc', x: 840, y: 350 },
                // Chat & Profile layer
                { id: 'tg-chat', componentId: 'chat-service', label: 'Chat Service', icon: '💬', color: '#0088cc', x: 260, y: 400 },
                { id: 'tg-profile', componentId: 'user-profile-svc', label: 'User Profile Service', icon: '👤', color: '#0088cc', x: 40, y: 440 },
                { id: 'tg-unread', componentId: 'unread-messages', label: 'Unread Messages', icon: '📩', color: '#0088cc', x: 740, y: 420 },
                // Services row
                { id: 'tg-group', componentId: 'group-service', label: 'Group Service', icon: '👥', color: '#0088cc', x: 120, y: 580 },
                { id: 'tg-session', componentId: 'session-service', label: 'Session Service', icon: '🔑', color: '#0088cc', x: 300, y: 580 },
                { id: 'tg-lastseen', componentId: 'last-seen-svc', label: 'Last Seen Service', icon: '👁️', color: '#0088cc', x: 480, y: 580 },
                { id: 'tg-relay', componentId: 'relay-service', label: 'Relay Service', icon: '🔀', color: '#0088cc', x: 660, y: 580 },
                // Database layer
                { id: 'tg-cache', componentId: 'memcached', label: 'Cache (Memcache)', icon: '🗃️', color: '#fb923c', x: 40, y: 720 },
                { id: 'tg-groupdb', componentId: 'group-db', label: 'GroupDB', icon: '🗄️', color: '#0088cc', x: 200, y: 720 },
                { id: 'tg-sessiondb', componentId: 'session-db', label: 'Session Information', icon: '🗄️', color: '#0088cc', x: 380, y: 720 },
                { id: 'tg-statusdb', componentId: 'status-db', label: 'StatusDB', icon: '🗄️', color: '#0088cc', x: 560, y: 720 },
            ],
            connections: [
                // Clients → Auth Gateway
                { from: 'tg-client1', to: 'tg-auth' },
                { from: 'tg-client2', to: 'tg-auth' },
                { from: 'tg-client3', to: 'tg-auth' },
                { from: 'tg-client4', to: 'tg-auth' },
                // Notification Server → Clients (push)
                { from: 'tg-notif', to: 'tg-client4' },
                // Auth → WebSocket
                { from: 'tg-auth', to: 'tg-ws', label: 'WebSocket' },
                // WebSocket ↔ Asset Service
                { from: 'tg-ws', to: 'tg-asset' },
                // Asset → CDN → Media Storage → Replicas
                { from: 'tg-asset', to: 'tg-cdn' },
                { from: 'tg-cdn', to: 'tg-media' },
                { from: 'tg-media', to: 'tg-replica1', label: 'Replicate' },
                { from: 'tg-media', to: 'tg-replica2', label: 'Replicate' },
                // Chat Service ↔ Asset Service, User Profile
                { from: 'tg-chat', to: 'tg-asset', label: 'HTTP' },
                { from: 'tg-chat', to: 'tg-profile', label: 'HTTP' },
                { from: 'tg-profile', to: 'tg-chat', label: 'HTTP' },
                // Chat Service → Lower services
                { from: 'tg-chat', to: 'tg-group', label: 'HTTP' },
                { from: 'tg-chat', to: 'tg-session', label: 'HTTP' },
                { from: 'tg-chat', to: 'tg-lastseen' },
                { from: 'tg-chat', to: 'tg-relay' },
                // Relay → Unread Messages & Notification
                { from: 'tg-relay', to: 'tg-unread' },
                { from: 'tg-relay', to: 'tg-notif' },
                // Services → Databases
                { from: 'tg-group', to: 'tg-cache' },
                { from: 'tg-group', to: 'tg-groupdb' },
                { from: 'tg-session', to: 'tg-sessiondb' },
                { from: 'tg-lastseen', to: 'tg-statusdb' },
            ]
        },
    },
];
