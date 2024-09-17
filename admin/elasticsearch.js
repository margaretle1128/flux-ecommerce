import { Client } from '@elastic/elasticsearch';

const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',  
    auth: {
        username: process.env.ELASTICSEARCH_USER || 'elastic',       
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'  
    }
});

export default client;
