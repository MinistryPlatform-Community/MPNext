-- =============================================
-- Ministry Platform Stored Procedure Install
-- Generated: 2026-03-03
-- =============================================
-- NOTE: Run this script against your Ministry Platform database
-- =============================================

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET NOCOUNT ON
GO

/****** Object:  StoredProcedure [dbo].[api_Custom_CreateSelection]    Script Date: 3/3/2026 ******/
DROP PROCEDURE IF EXISTS [dbo].[api_Custom_CreateSelection]
GO

-- =============================================
-- api_Custom_CreateSelection
-- =============================================
-- Description: Creates a new MP Selection with the given records for a user/page.
-- Last Modified: 3/3/2026
-- =============================================
CREATE PROCEDURE [dbo].[api_Custom_CreateSelection]
    @DomainID INT,
    @PageID INT,
    @UserID INT,
    @SelectionName NVARCHAR(255),
    @RecordIDs NVARCHAR(MAX)  -- comma-separated, e.g. '1001,1002,1003'
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dp_Selections (Selection_Name, Page_ID, User_ID)
    VALUES (@SelectionName, @PageID, @UserID);

    DECLARE @SelectionID INT = SCOPE_IDENTITY();

    INSERT INTO dp_Selected_Records (Selection_ID, Record_ID)
    SELECT @SelectionID, CAST(LTRIM(RTRIM(x.value('.', 'VARCHAR(MAX)'))) AS INT)
    FROM (
        SELECT CAST('<r>' + REPLACE(@RecordIDs, ',', '</r><r>') + '</r>' AS XML)
    ) t(xml)
    CROSS APPLY t.xml.nodes('/r') AS n(x)
    WHERE LTRIM(RTRIM(x.value('.', 'VARCHAR(MAX)'))) != '';

    SELECT
        @SelectionID   AS Selection_ID,
        @SelectionName AS Selection_Name,
        (SELECT COUNT(*) FROM dp_Selected_Records WHERE Selection_ID = @SelectionID) AS Record_Count;
END
GO

-- =============================================
-- SP MetaData Install
-- =============================================
DECLARE @spName NVARCHAR(128) = 'api_Custom_CreateSelection';
DECLARE @spDescription NVARCHAR(500) = 'Creates a new MP Selection with the given records for a user/page.';

IF NOT EXISTS (
    SELECT API_Procedure_ID FROM dp_API_Procedures WHERE Procedure_Name = @spName
)
BEGIN
    INSERT INTO dp_API_Procedures (Procedure_Name, Description)
    VALUES (@spName, @spDescription);
END

-- Grant to Administrators Role
DECLARE @AdminRoleID INT = (
    SELECT Role_ID FROM dp_Roles WHERE Role_Name = 'Administrators'
);

IF NOT EXISTS (
    SELECT 1
    FROM dp_Role_API_Procedures RP
    INNER JOIN dp_API_Procedures AP ON AP.API_Procedure_ID = RP.API_Procedure_ID
    WHERE AP.Procedure_Name = @spName AND RP.Role_ID = @AdminRoleID
)
BEGIN
    INSERT INTO dp_Role_API_Procedures (Domain_ID, API_Procedure_ID, Role_ID)
    VALUES (
        1,
        (SELECT API_Procedure_ID FROM dp_API_Procedures WHERE Procedure_Name = @spName),
        @AdminRoleID
    );
END
GO
