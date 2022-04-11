-- AddForeignKey
ALTER TABLE `pay_type` ADD CONSTRAINT `pay_type_pay_id_fkey` FOREIGN KEY (`pay_id`) REFERENCES `Pay`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
