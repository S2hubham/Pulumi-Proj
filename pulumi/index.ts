import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Create an S3 bucket with website configuration enabled and public-read ACL
const bucket = new aws.s3.BucketV2("my-bucket", {
    acl: "public-read",
    websites: [{
        indexDocument: "index.html",
        errorDocument: "404.html",
    }],
});

// Disable block public access that would prevent public ACLs
const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("myBucketPublicAccess", {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
});

// Create a CloudFront distribution to serve the website
const originId = "S3-my-bucket";

// Note: Since we're using the S3 website endpoint, we need to use custom origin config.
const distribution = new aws.cloudfront.Distribution("cdn", {
    enabled: true,
    origins: [{
        domainName: bucket.websiteEndpoint, // S3 website endpoint (HTTP-only)
        originId: originId,
        customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: "http-only",  // S3 website endpoints support HTTP only
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
    priceClass: "PriceClass_100",  // Covers US, Canada, and Europe
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,  // Using CloudFront's default cert for HTTPS
    },
    restrictions: {
        geoRestriction: {
            restrictionType: "none",
        },
    },
});

// Export outputs for reference
export const bucketName = bucket.id;
export const websiteUrl = bucket.websiteEndpoint;
export const cdnUrl = distribution.domainName;
