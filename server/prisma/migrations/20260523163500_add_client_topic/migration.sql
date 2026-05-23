-- CreateTable
CREATE TABLE "ClientTopic" (
    "clientId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTopic_pkey" PRIMARY KEY ("clientId","topicId")
);

-- AddForeignKey
ALTER TABLE "ClientTopic" ADD CONSTRAINT "ClientTopic_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientTopic" ADD CONSTRAINT "ClientTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
