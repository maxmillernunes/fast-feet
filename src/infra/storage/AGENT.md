# STORAGE

AWS S3 para upload e armazenamento de arquivos.

## O QUE CONTÉM

```
storage/
├── storage.module.ts  # Module de configuração
└── aws-storage.ts     # Implementação S3
```

---

## INTERFACE DO DOMÍNIO

```typescript
// src/domain/logistics/application/storage/uploader.ts
export abstract class Uploader {
  abstract upload(params: UploadParams): Promise<{ url: string }>
}

export interface UploadParams {
  fileName: string
  fileType: string
  body: Buffer
}
```

---

## AWS S3 IMPLEMENTATION

```typescript
// src/infra/storage/aws-storage.ts
@Injectable()
export class AwsStorage implements Uploader {
  private readonly client: S3Client

  constructor(private envService: EnvService) {
    this.client = new S3Client({
      region: envService.get('AWS_REGION'),
      endpoint: envService.get('AWS_ENDPOINT'),
      credentials: {
        accessKeyId: envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    })
  }

  async upload({
    body,
    fileName,
    fileType,
  }: UploadParams): Promise<{ url: string }> {
    const uploadId = randomUUID()
    const uniqueFileName = `${uploadId}-${fileName}`

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.envService.get('AWS_S3_BUCKET'),
        Body: body,
        Key: uniqueFileName,
        ContentType: fileType,
      }),
    )

    return { url: uniqueFileName }
  }
}
```

---

## CONFIGURAÇÃO

Variáveis de ambiente necessárias:

| Variável              | Descrição                     |
| --------------------- | ------------------------------|
| `AWS_REGION`          | Região AWS (ex: us-east-1)   |
| `AWS_ENDPOINT`       | Endpoint S3 (para local/minio)|
| `AWS_ACCESS_KEY_ID`  | Access Key AWS               |
| `AWS_SECRET_ACCESS_KEY`| Secret Key AWS              |
| `AWS_S3_BUCKET`      | Nome do bucket S3            |

---

## USO EM CONTROLLER

```typescript
@Controller('/attachments')
export class UploadAttachmentController {
  constructor(private uploader: Uploader) {}

  @Post()
  @UseGuards(RequireRoles('DRIVER'))
  async handle(
    @UploadedFile(fileValidationPipe) file: Express.Multer.File,
  ) {
    const result = await this.uploader.upload({
      body: file.buffer,
      fileName: file.originalname,
      fileType: file.mimetype,
    })

    return { url: result.url }
  }
}
```

---

## STORAGE MODULE

```typescript
// src/infra/storage/storage.module.ts
@Module({
  providers: [
    {
      provide: Uploader,
      useClass: AwsStorage,
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
```

---

## REGRA DE IMPORTAÇÃO

O storage implementa interface definida em `domain/logistics/application/storage/`.

```
domain/  → Define Uploader (abstrato)
infra/   → Implementa AwsStorage (concreto)
```