import React, { useState, useEffect } from "react";
import data from "./data/data.json";
import ownersData from "./data/owners_data.json";

const App = () => {
  const [guideData] = useState(data);
  const [owners] = useState(ownersData);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [uniqueValues, setUniqueValues] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [ownerDetails, setOwnerDetails] = useState(null);

  useEffect(() => {
    if (category === "COUNTY" || category === "OWNER_NAME") {
      const unique = [
        ...new Set(guideData.map((item) => item[category]?.trim() || "N/A")),
      ].sort((a, b) => a.localeCompare(b));
      setUniqueValues(unique);
    } else {
      setUniqueValues([]);
    }
  }, [category, guideData]);

  const handleSearch = () => {
    const term = searchTerm.trim();
    let filtered = [];

    if (category === "AI_ID") {
      filtered = guideData.filter((item) => item[category]?.toString() === term); // Exact match
    } else if (category === "AI_NAME" || category === "ADDRESS_1") {
      filtered = guideData.filter((item) =>
        item[category]?.toString().toLowerCase().includes(term.toLowerCase())
      );
    }
    setFilteredData(filtered);
  };

  const handleDropdownSelection = (value) => {
    const filtered = guideData.filter((item) => (item[category] || "N/A") === value);
    setFilteredData(filtered);
  };

  const handleOwnerInfo = (ownerName) => {
    const owner = owners.find(
      (o) => o.OWNER_NAME?.toLowerCase() === ownerName.toLowerCase()
    );
    setOwnerDetails(owner || null);
  };

  const groupTanksByFacility = () => {
    const grouped = {};
    filteredData.forEach((site) => {
      if (!grouped[site.AI_ID]) {
        grouped[site.AI_ID] = {
          facility: site,
          tanks: [],
        };
      }
      grouped[site.AI_ID].tanks.push(site);
    });
    return Object.values(grouped);
  };

  const openGoogleMaps = (latitude, longitude) => {
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (!isNaN(lat) && !isNaN(lon)) {
      const url = `https://www.google.com/maps?q=${lat},${lon}`;
      window.open(url, "_blank");
    } else {
      alert(
        "Latitude and Longitude not available or not in the correct format for this site."
      );
    }
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <header style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={`${process.env.PUBLIC_URL}/shield-logo.jpg`}
          alt="Company Logo"
          style={{ maxWidth: "200px", height: "auto" }}
        />
        <h1>Shield Environmental Associates Convenient Store Information for Kentucky</h1>
      </header>

      <div style={{ marginBottom: "20px" }}>
        <label>Select Category:</label>
        <select
          onChange={(e) => setCategory(e.target.value)}
          value={category}
          style={{ marginLeft: "10px", padding: "5px" }}
        >
          <option value="">--Select--</option>
          <option value="AI_NAME">AI Name (Search)</option>
          <option value="AI_ID">AI ID (Search)</option>
          <option value="ADDRESS_1">Address (Search)</option>
          <option value="COUNTY">County (Dropdown)</option>
          <option value="OWNER_NAME">Owner (Dropdown)</option>
        </select>
      </div>

      {["COUNTY", "OWNER_NAME"].includes(category) && (
        <div style={{ marginBottom: "20px" }}>
          <label>Select Value:</label>
          <select
            onChange={(e) => handleDropdownSelection(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="">--Select--</option>
            {uniqueValues.map((val, index) => (
              <option key={index} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      )}

      {["AI_NAME", "AI_ID", "ADDRESS_1"].includes(category) && (
        <div style={{ marginBottom: "20px" }}>
          <label>Enter Search Term:</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginLeft: "10px", padding: "5px" }}
          />
          <button
            onClick={handleSearch}
            style={{ marginLeft: "10px", padding: "5px 10px" }}
          >
            Search
          </button>
        </div>
      )}

      <section>
        {filteredData.length > 0 ? (
          groupTanksByFacility().map(({ facility, tanks }) => (
            <div
              key={facility.AI_ID}
              style={{
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "10px",
                marginBottom: "20px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h2>{facility.AI_NAME}</h2>
              <p>
                <strong>Address:</strong> {facility.ADDRESS_1 || "N/A"},{" "}
                {facility.MAILING_ADDRESS_CITY || "N/A"},{" "}
                {facility.MAILING_ADDRESS_STATE || "N/A"}{" "}
                {facility.MAILING_ADDRESS_ZIP || "N/A"}
              </p>
              <p>
                <strong>County:</strong> {facility.COUNTY || "N/A"}
              </p>
              <button
                onClick={() => openGoogleMaps(facility.LONGITUDE, facility.LATITUDE)}
                style={{ padding: "5px 10px", marginTop: "10px" }}
              >
                View on Google Maps
              </button>
              <table border="1" style={{ width: "100%", marginTop: "10px" }}>
                <tbody>
                  {[
"SUBJECT_ITEM_ID",
        "COMPARTMENT_NUMBER",
        "TANK_SUBSTANCE_CODE",
        "CAPACITY_MSR",
        "TANK_STATUS_CODE",
        "TANK_INSTALL_DATE",
        "TEMP_CLOSE_DATE",
        "LAST_CONT_PRODUCT_DATE",
        "CLOSED_IN_PLACE_DATE",
        "REMOVAL_DATE",
        "SERVICE_CHANGE_DATE",
        "TANK_MATERIAL_CODE",
        "TANK_EXT_CORR_PROTECT_CODE",
        "LAST_CP_TEST_DATE",
        "TANK_MANUFCTR_CODE",
        "TANK_RELEASE_DETECT_CODE",
        "LAST_TANK_TEST_DATE",
        "PIPE_MATERIAL_CODE",
        "PIPE_EXT_CORR_PROTECT_CODE",
        "PIPE_TYPE_CODE",
        "LINE_LEAK_DETECT_CODE",
                  ].map((field, rowIndex) => (
                    <tr key={rowIndex}>
                      <td>
                        <strong>{field.replace(/_/g, " ")}</strong>
                      </td>
                      {tanks.map((tank, colIndex) => (
                        <td key={colIndex}>{tank[field] || "N/A"}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <strong>Owner Name</strong>
                    </td>
                    {tanks.map((tank, colIndex) => (
                      <td key={colIndex}>
                        {tank.OWNER_NAME || "N/A"}
                        <button
                          style={{ marginLeft: "10px", padding: "5px" }}
                          onClick={() => handleOwnerInfo(tank.OWNER_NAME)}
                        >
                          View Owner Info
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p>Please select a category and a value or enter a search term to display results.</p>
        )}
      </section>

      {ownerDetails && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        >
          <h2>Owner Information</h2>
          <p><strong>Name:</strong> {ownerDetails.OWNER_NAME}</p>
          <p><strong>Address 1:</strong> {ownerDetails.OWNER_ADDR1 || "N/A"}</p>
          <p><strong>City:</strong> {ownerDetails.OWNER_CITY || "N/A"}</p>
          <p><strong>State:</strong> {ownerDetails.OWNER_STATE || "N/A"}</p>
          <p><strong>Zip:</strong> {ownerDetails.OWNER_ZIP || "N/A"}</p>
          <p><strong>Phone:</strong> {ownerDetails.OWNER_PHONE || "N/A"}</p>
          <button
            onClick={() => setOwnerDetails(null)}
            style={{ marginTop: "10px", padding: "5px 10px" }}
          >
            Close
          </button>
        </div>
      )}

      <footer style={{ textAlign: "center", marginTop: "20px" }}>
        <p>Shield Environmental Associates, Inc. 2024</p>
      </footer>
    </div>
  );
};

export default App;


