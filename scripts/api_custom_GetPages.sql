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

/****** Object:  StoredProcedure [dbo].[api_custom_GetPages]    Script Date: 3/3/2026 ******/
DROP PROCEDURE IF EXISTS [dbo].[api_custom_GetPages]
GO

-- =============================================
-- api_custom_GetPages
-- =============================================
-- Description: Returns MP pages with optional search by display name.
-- Last Modified: 3/3/2026
-- =============================================
CREATE PROCEDURE [dbo].[api_custom_GetPages]
    @DomainID INT,
    @SearchName NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT Page_ID, Display_Name
    FROM dp_Pages
    WHERE @SearchName IS NULL
       OR Display_Name LIKE '%' + @SearchName + '%'
    ORDER BY Display_Name
END
GO

-- =============================================
-- SP MetaData Install
-- =============================================
DECLARE @spName NVARCHAR(128) = 'api_custom_GetPages';
DECLARE @spDescription NVARCHAR(500) = 'Returns MP pages with optional search by display name.';

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
