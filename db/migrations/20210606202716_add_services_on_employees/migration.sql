-- CreateTable
CREATE TABLE "_EmployeeToService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EmployeeToService_AB_unique" ON "_EmployeeToService"("A", "B");

-- CreateIndex
CREATE INDEX "_EmployeeToService_B_index" ON "_EmployeeToService"("B");

-- AddForeignKey
ALTER TABLE "_EmployeeToService" ADD FOREIGN KEY ("A") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EmployeeToService" ADD FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
