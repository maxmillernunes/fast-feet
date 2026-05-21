import { config } from 'dotenv'
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

async function main() {
  const endpoint = process.env.AWS_ENDPOINT
  const region = process.env.AWS_REGION
  const bucket = process.env.AWS_S3_BUCKET
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!endpoint || !bucket) {
    console.log(
      'AWS_ENDPOINT ou AWS_S3_BUCKET não definidos, pulando criação do bucket.',
    )
    return
  }

  const client = new S3Client({
    endpoint,
    region: region ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: accessKeyId ?? 'test',
      secretAccessKey: secretAccessKey ?? 'test',
    },
  })

  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
    console.log(`Bucket "${bucket}" criado com sucesso.`)
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.name === 'BucketAlreadyExists' ||
        err.name === 'BucketAlreadyOwnedByYou')
    ) {
      console.log(`Bucket "${bucket}" já existe.`)
    } else {
      throw err
    }
  }
}

main().catch((e) => {
  console.error('Erro ao criar bucket:', e.message)
  process.exit(1)
})
