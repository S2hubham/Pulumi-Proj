import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";


const bucket = new aws.s3.BucketV2("my-bucket", {
    acl: "public-read",
    websites: [{
        indexDocument: "index.html",
        errorDocument: "404.html",
    }],
});


const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("myBucketPublicAccess", {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
});


const originId = "S3-my-bucket";


const distribution = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [{
        domainName: bucket.websiteEndpoint, 
        originId: originId,
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "http-only",  
            originSslProtocols: ["TLSv1.2"],
        },
    }],
    defaultCacheBehavior: {
        targetOriginId: originId,
        viewerProtocolPolicy: "redirect-to-https",
        allowedMethods: ["GET", "HEAD"],
        cachedMethods: ["GET", "HEAD"],
        forwardedValues: {
            queryString: false,
            cookies: { forward: "none" },
        },
    },
    defaultRootObject: "index.html",
    priceClass: "PriceClass_100",  
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,  
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
});


export const bucketName = bucket.id;
export const websiteUrl = bucket.websiteEndpoint;
export const cdnUrl = distribution.domainName;
